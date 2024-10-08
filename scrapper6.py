import requests
from bs4 import BeautifulSoup
import json
from urllib.parse import urljoin, urlparse

# Configuration
BASE_URL = 'https://www.drupal.org/about/drupal-7/d7eol/partners'
MAX_DEPTH = 1  # Specify the maximum depth to follow internal links
scraped_data = {}

def scrape_page(url, depth):
    """
    Scrapes the content of a webpage and follows internal links.

    Args:
        url (str): The URL of the page to scrape.
        depth (int): The current depth of the scraping.

    Returns:
        dict: A dictionary containing the scraped content and internal links.
    """
    if depth > MAX_DEPTH:
        return {}

    # Check if the URL is already scraped to avoid duplication
    if url in scraped_data:
        return scraped_data[url]

    print(f'Scraping: {url} (Depth: {depth})')
    
    # Send a GET request to fetch the content of the page
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for bad responses
    except requests.exceptions.RequestException as e:
        print(f'Error fetching {url}: {e}')
        return {}

    # Parse the page content
    soup = BeautifulSoup(response.content, 'html.parser')

    # Scrape the title and text content
    title = soup.title.string if soup.title else 'No title'
    content = soup.get_text(separator=' ', strip=True)

    # Store scraped data
    scraped_data[url] = {
        'title': title,
        'content': content,
        'internal_links': []
    }

    # Find all internal links on the page
    for link in soup.find_all('a', href=True):
        href = link['href']
        full_url = urljoin(BASE_URL, href)  # Make absolute URL

        # Check if the link is an internal link
        if urlparse(full_url).netloc == urlparse(BASE_URL).netloc:
            # Store the link in the current page's data
            scraped_data[url]['internal_links'].append(full_url)

            # Recursively scrape the linked page
            scrape_page(full_url, depth + 1)

    return scraped_data[url]

def save_to_json(file_name, data):
    """
    Saves the scraped data to a JSON file.

    Args:
        file_name (str): The name of the JSON file to save the data.
        data (dict): The data to save.
    """
    with open(file_name, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f'Data saved to {file_name}')

# =========================
# Main Execution Block
# =========================
if __name__ == '__main__':
    # Start scraping from the base URL
    scrape_page(BASE_URL, 0)

    # Save scraped data to a JSON file
    save_to_json('drupal_migration_scraped.json', scraped_data)
