import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Fetch URL and API key from environment variables
url: str = os.environ.get("DB_URL")
key: str = os.environ.get("DB_API_KEY")

# Create Supabase client
supabase: Client = create_client(url, key)

# Example: fetch all rows from a table called 'users'
response = supabase.table("users").select("*").execute()
print(response.data)
