from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from bs4 import BeautifulSoup
import fitz  # PyMuPDF
import hashlib
import json
from supabase import create_client, Client
import os
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv()

# Initialize Supabase and Gemini API
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
embed_model = SentenceTransformer("all-MiniLM-L6-v2")

app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Flag to prevent concurrent operations
operation_in_progress = False

# Function to extract text from PDF
def extract_text_from_pdf(pdf_file):
    doc = fitz.open(stream=pdf_file.read(), filetype="pdf")
    text = "\n".join([page.get_text("text") for page in doc])
    return text

# Function to fetch and clean scraped content from a URL
def fetch_and_clean_url(url):
    headers = {"User-Agent": "Mozilla/5.0"}
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()  # Raise error for bad responses (4xx, 5xx)
    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None
    soup = BeautifulSoup(response.text, 'html.parser')
    # Clean the soup by removing script/style elements
    for script in soup(['script', 'style']):
        script.decompose()
    return soup.get_text(strip=True)

# Function to store content in Supabase with embeddings
def store_in_supabase(text, source_name):
    # Delete all previous documents before inserting new ones
    supabase.table("documents").delete().neq("doc_id", "").execute()
    # Generate document ID based on the source (filename or URL)
    doc_id = hashlib.md5(source_name.encode()).hexdigest()
    # Chunk the text to store in database
    chunks = [text[i:i+500] for i in range(0, len(text), 500)]
    embeddings = embed_model.encode(chunks).tolist()
    for chunk, embedding in zip(chunks, embeddings):
        data = {"doc_id": doc_id, "text": chunk, "embedding": json.dumps(embedding), "source": source_name}
        supabase.table("documents").insert(data).execute()

# Function to handle scraping of the URL
def scrape_url(url):
    text = fetch_and_clean_url(url)
    if text:
        store_in_supabase(text, url)
        return "URL scraped and data stored successfully!"
    return "Error scraping URL."

# Function to handle PDF upload and processing
def upload_pdf(pdf_file, filename):
    text = extract_text_from_pdf(pdf_file)
    store_in_supabase(text, filename)
    return "PDF uploaded and data stored successfully!"

# Endpoint to handle PDF upload
@app.route('/upload_pdf', methods=['POST'])
def upload_pdf_endpoint():
    global operation_in_progress
    if operation_in_progress:
        return jsonify({"error": "An operation is already in progress. Please try again later."}), 400
    operation_in_progress = True
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        uploaded_file = request.files['file']
        if uploaded_file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        message = upload_pdf(uploaded_file, uploaded_file.filename)
        return jsonify({"message": message}), 200
    finally:
        operation_in_progress = False

# Endpoint to handle URL scraping
@app.route('/scrape_url', methods=['POST'])
def scrape_url_endpoint():
    global operation_in_progress
    if operation_in_progress:
        return jsonify({"error": "An operation is already in progress. Please try again later."}), 400
    operation_in_progress = True
    try:
        data = request.json
        url = data.get('url')
        if not url:
            return jsonify({"error": "No URL provided"}), 400
        message = scrape_url(url)
        return jsonify({"message": message}), 200
    finally:
        operation_in_progress = False

# Endpoint to handle asking questions
@app.route('/ask_question', methods=['POST'])
def ask_question_endpoint():
    global operation_in_progress
    if operation_in_progress:
        return jsonify({"error": "An operation is already in progress. Please try again later."}), 400
    operation_in_progress = True
    try:
        data = request.json
        question = data.get('question')
        if not question:
            return jsonify({"error": "No question provided"}), 400

        # Step 1: Search for relevant documents from Supabase
        context = search_supabase(question)
        # Step 2: Get the response from Gemini AI using the retrieved context
        if context != "No relevant information found.":
            answer = get_gemini_response(context, question)
            return jsonify({"answer": answer, "source": "Document source or URL"}), 200
        else:
            return jsonify({"answer": "I don't have enough information.", "source": "No source available"}), 200
    finally:
        operation_in_progress = False

# Function to search Supabase for relevant embeddings
def search_supabase(query, top_k=10):
    """Searches Supabase for relevant embeddings."""
    query_embedding = embed_model.encode([query]).tolist()[0]
    response = supabase.rpc("match_documents", {"query_embedding": query_embedding, "match_count": top_k}).execute()
    if response.data:
        return "\n".join([item["text"] for item in response.data])
    return "No relevant information found."

# Function to get a response from Gemini AI based on retrieved context
def get_gemini_response(context, question):
    """Gets response from Gemini AI based on retrieved context."""
    model = genai.GenerativeModel("gemini-1.5-pro")
    prompt = f""" You are an AI assistant answering questions based on a document.
    Context: {context}
    Question: {question}
    Provide a detailed and relevant answer based ONLY on the context.
    If no relevant context is found, reply: "I don't have enough information."
    """
    response = model.generate_content(prompt)
    return response.text

# Main function to run the app
if __name__ == '__main__':
    app.run(debug=True)
