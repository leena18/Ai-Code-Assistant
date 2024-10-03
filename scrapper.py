import requests  # Import the requests library to handle HTTP requests
from bs4 import BeautifulSoup  # Import BeautifulSoup for parsing HTML
import json  # Import JSON library for handling JSON data
import os  # Import os for directory operations
from urllib.parse import urljoin, urlparse  # Import functions for URL manipulation

# Create a directory to store scraped data if it doesn't exist
os.makedirs('scraped_data', exist_ok=True)

# List of base URLs to scrape
base_urls = [
    "https://www.drupal.org/docs/develop/drupal-apis",
    "https://www.drupal.org/documentation",
    # You can add more URLs here as needed
]

# Function to scrape a single page
def scrape_page(url):
    try:
        # Send a GET request to the URL
        response = requests.get(url)
        # Raise an error for bad responses (status codes 4xx or 5xx)
        response.raise_for_status()  
        
        # Parse the page content with BeautifulSoup
        soup = BeautifulSoup(response.text, 'lxml')

        # Extract the content you want to scrape (example: all <h2> tags)
        content = soup.find_all('h2')  # Modify this to target different elements as needed
        scraped_content = [h2.text for h2 in content]  # Collect text from the <h2> tags

        # Find all internal links in the page
        internal_links = []
        for link in soup.find_all('a', href=True):  # Loop through all <a> tags with href attribute
            href = link['href']
            # Check if the link is internal (same domain or starts with '/')
            if href.startswith('/') or urlparse(href).netloc == urlparse(url).netloc:
                # Convert relative URLs to absolute URLs
                internal_links.append(urljoin(url, href))

        # Return the scraped content and internal links
        return scraped_content, internal_links

    except requests.exceptions.RequestException as e:
        # Print error message if there was an issue with the request
        print(f"Error scraping {url}: {e}")
        return [], []  # Return empty content and links in case of an error

# Dictionary to hold all scraped data
all_scraped_data = {}

# Set to hold visited URLs to avoid scraping the same page multiple times
visited_urls = set()

# Loop through the list of base URLs to start scraping
for url in base_urls:
    print(f"Scraping: {url}")  # Print the URL being scraped
    content, internal_links = scrape_page(url)  # Call the scraping function
    all_scraped_data[url] = {
        'content': content,  # Store the scraped content
        'internal_links': []  # Initialize a list for internal links
    }
    
    # Scrape internal links found on the base URL
    for link in internal_links:
        if link not in visited_urls:  # Check if the link has not been visited
            visited_urls.add(link)  # Mark this link as visited
            print(f"Scraping internal link: {link}")  # Print the internal link being scraped
            internal_content, _ = scrape_page(link)  # Scrape the internal link
            # Append the scraped internal content to the dictionary
            all_scraped_data[url]['internal_links'].append({
                'url': link,  # Store the URL of the internal link
                'content': internal_content  # Store the scraped content from the internal link
            })

# Save the scraped data to a JSON file
with open('scraped_data/all_scraped_data.json', 'w', encoding='utf-8') as f:
    json.dump(all_scraped_data, f, ensure_ascii=False, indent=4)  # Write JSON data to file with UTF-8 encoding

print("Scraping completed and data saved.")  # Print a message when scraping is done
