import requests
import json
import time

# =========================
# Configuration Parameters
# =========================

# Stack Exchange API endpoint for advanced question search
API_ENDPOINT = "https://api.stackexchange.com/2.3/search/advanced"

# Your Stack Exchange API key
API_KEY = ''  # Replace with your actual API key

# Parameters for fetching questions
QUESTIONS_PARAMS = {
    'order': 'desc',          # Order results descending by activity
    'sort': 'activity',       # Sort by most recent activity
    'tagged': 'drupal',       # Tag to filter questions (Drupal-related)
    'site': 'stackoverflow',  # Stack Exchange site to query
    'pagesize': 10,          # Number of questions per page (max 100)
    'page': 1,                # Starting page number
    'filter': 'withbody',     # Include the body of the questions
    'key': API_KEY,           # Your API key
}

# Maximum number of pages to fetch to prevent excessive API calls, otherwise very long running code
MAX_PAGES = 50  # Adjust this value as needed

# Delay between API requests in seconds to respect rate limits
REQUEST_DELAY = 1  # Adjust based on your API quota and requirements

# =========================
# Initialize Data Storage
# =========================

# List to store all fetched questions and their answers
all_questions_and_answers = []

# =========================
# Function Definitions
# =========================

def fetch_answers_for_question(question_id, api_key):
    """
    Fetches answers for a given question ID from Stack Overflow.

    Args:
        question_id (int): The ID of the question to fetch answers for.
        api_key (str): Your Stack Exchange API key.

    Returns:
        list: A list of answer dictionaries. Empty list if no answers or on error.
    """
    # Endpoint to fetch answers for a specific question
    answers_endpoint = f"https://api.stackexchange.com/2.3/questions/{question_id}/answers"
    
    # Parameters for the answers API request
    answer_params = {
        'order': 'desc',         # Order answers descending by activity
        'sort': 'activity',      # Sort by most recent activity
        'site': 'stackoverflow', # Stack Exchange site
        'filter': 'withbody',    # Include the body of the answers
        'pagesize': 100,         # Maximum number of answers per request
        'key': api_key,          # Your API key
    }

    try:
        # Make a GET request to fetch answers
        response = requests.get(answers_endpoint, params=answer_params)
        response.raise_for_status()  # Raise exception for HTTP errors
        data = response.json()

        # Check if 'items' exist and contain answers
        if 'items' in data and data['items']:
            print(f"Fetched {len(data['items'])} answers for question ID {question_id}.")
            return data['items']
        else:
            print(f"No answers found for question ID {question_id}.")
            return []

    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred while fetching answers for question ID {question_id}: {http_err}")
    except requests.exceptions.RequestException as req_err:
        print(f"Request exception occurred while fetching answers for question ID {question_id}: {req_err}")
    except json.JSONDecodeError:
        print(f"Error decoding JSON response for answers of question ID {question_id}.")
    except Exception as err:
        print(f"An unexpected error occurred while fetching answers for question ID {question_id}: {err}")

    return []  # Return empty list in case of any errors

def fetch_drupal_questions(api_key):
    """
    Fetches Drupal-related questions from Stack Overflow and their corresponding answers.

    Args:
        api_key (str): Your Stack Exchange API key.
    """
    global all_questions_and_answers  # Declare as global to modify the list

    while True:
        # Print the current page number being fetched
        print(f"Fetching page {QUESTIONS_PARAMS['page']} of questions...")

        try:
            # Make a GET request to fetch questions based on the defined parameters
            response = requests.get(API_ENDPOINT, params=QUESTIONS_PARAMS)
            response.raise_for_status()  # Raise exception for HTTP errors
            data = response.json()
        except requests.exceptions.HTTPError as http_err:
            print(f"HTTP error occurred while fetching questions: {http_err}")
            break
        except requests.exceptions.RequestException as req_err:
            print(f"Request exception occurred while fetching questions: {req_err}")
            break
        except json.JSONDecodeError:
            print("Error decoding the JSON response for questions.")
            print("Raw response:", response.text)
            break
        except Exception as err:
            print(f"An unexpected error occurred while fetching questions: {err}")
            break

        # Check if 'items' exist in the response
        if 'items' not in data:
            print("No items found in the response for questions.")
            break

        # Iterate through each question item
        for item in data['items']:
            question_id = item.get('question_id')  # Extract question ID
            if not question_id:
                print("Question ID not found in the item. Skipping...")
                continue

            # Fetch answers for the current question
            answers = fetch_answers_for_question(question_id, api_key)
            item['answers'] = answers  # Attach the answers to the question

        # Add the fetched questions (with answers) to the main list
        all_questions_and_answers.extend(data['items'])

        # Debugging: Print the number of questions fetched so far
        print(f"Total questions fetched so far: {len(all_questions_and_answers)}")

        # Check if there are more pages to fetch and if the maximum page limit hasn't been reached
        if data.get('has_more') and QUESTIONS_PARAMS['page'] < MAX_PAGES:
            QUESTIONS_PARAMS['page'] += 1  # Move to the next page
            print(f"Preparing to fetch page {QUESTIONS_PARAMS['page']} of questions...")
            time.sleep(REQUEST_DELAY)  # Delay to respect API rate limits
        else:
            if data.get('has_more'):
                print(f"Reached the maximum page limit of {MAX_PAGES}. Stopping further requests.")
            else:
                print("All available pages of questions have been fetched.")
            break  # Exit the loop as there are no more pages or the limit is reached

def save_to_json(file_name, data):
    """
    Saves the fetched data to a JSON file.

    Args:
        file_name (str): The name of the JSON file to save the data.
        data (list): The data to save (list of questions and answers).
    """
    try:
        with open(file_name, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print(f"Data successfully saved to {file_name}.")
    except Exception as err:
        print(f"Failed to save data to {file_name}: {err}")

# =========================
# Main Execution Block
# =========================

if __name__ == '__main__':
    print("Starting to fetch Drupal-related questions and their answers from Stack Overflow...")

    # Ensure that the API key has been set
    if API_KEY == 'YOUR_API_KEY':
        print("Error: Please replace 'YOUR_API_KEY' with your actual Stack Exchange API key in the script.")
    else:
        fetch_drupal_questions(API_KEY)  # Fetch questions and their answers
        save_to_json('drupal_questions_and_answers_limited.json', all_questions_and_answers)  # Save to JSON
        print("Scraping complete!")
