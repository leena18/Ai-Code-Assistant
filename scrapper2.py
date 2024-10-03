import requests
import json
import time

# API endpoint for Stack Exchange (Stack Overflow)
API_ENDPOINT = "https://api.stackexchange.com/2.3/search/advanced"

# Define the parameters for the API request
params = {
    'order': 'desc',          # Ordering of results, descending based on activity
    'sort': 'activity',       # Sort by most recent activity
    'tagged': 'drupal',       # Specific tag (Drupal-related questions)
    'site': 'stackoverflow',  # Site to query (Stack Overflow)
    'pagesize': 10,          # Max number of results per page (100 is the maximum allowed)
    'page': 1,                # Start with the first page
    'filter': 'withbody',     # Include the body of the questions
    'key': 'rl_sREru6z4a3TJ2birSmg1TVrR6',  # API key (replace with your own key)
}

# Initialize an empty list to store all fetched questions and answers
all_questions_and_answers = []

# Function to fetch questions and their answers from the API
def fetch_drupal_questions():
    while True:
        # Make a GET request to the Stack Exchange API with defined parameters
        response = requests.get(API_ENDPOINT, params=params)

        # Check if the request was successful
        if response.status_code == 200:
            try:
                data = response.json()  # Convert the API response to JSON format
            except json.JSONDecodeError:
                print("Error decoding the JSON response. Raw response:", response.text)
                break  # Exit the loop if there is a JSON decoding issue

            # Check if the response contains 'items' which represent the questions
            if 'items' in data:
                for item in data['items']:
                    # For each question, also fetch its answers using a separate API request
                    question_id = item['question_id']
                    answers = fetch_answers_for_question(question_id)
                    item['answers'] = answers  # Attach the answers to the question

                # Add the questions and answers to the list
                all_questions_and_answers.extend(data['items'])

                # Check if there are more pages of results to fetch
                if data.get('has_more'):
                    params['page'] += 1  # Increment the page number for the next request
                    print(f"Fetched page {params['page']} of questions...")
                    time.sleep(60)  # Add a longer delay between requests to avoid rate limits
                else:
                    print("All pages fetched.")
                    break  # Exit the loop if no more pages are available
            else:
                print("No items found in the response.")
                break  # Exit the loop if no questions are returned

        elif response.status_code == 400:
            data = response.json()
            if data.get('error_name') == 'throttle_violation':
                retry_after = int(data.get('error_message').split()[-2])  # Parse the retry-after time
                print(f"Too many requests. Waiting for {retry_after} seconds.")
                time.sleep(retry_after)  # Wait for the specified duration before retrying
                break  # Stop the script after waiting, to avoid more requests until the timeout expires

        else:
            print(f"Failed to fetch data. HTTP Status Code: {response.status_code}")
            print("Raw response:", response.text)
            break  # Exit the loop if the request was not successful

# Function to fetch answers for a given question
def fetch_answers_for_question(question_id):
    answers_endpoint = f"https://api.stackexchange.com/2.3/questions/{question_id}/answers"
    answer_params = {
        'order': 'desc',
        'sort': 'activity',
        'site': 'stackoverflow',
        'filter': 'withbody',  # Get the full body of the answers
        'key': 'rl_sREru6z4a3TJ2birSmg1TVrR6',  # Your API key
    }

    # Make a GET request to fetch the answers
    response = requests.get(answers_endpoint, params=answer_params)

    # Check if the request was successful
    if response.status_code == 200:
        try:
            data = response.json()
            # Check if the response contains 'items' which represent the answers
            if 'items' in data:
                return data['items']  # Return the list of answers
            else:
                return []  # Return an empty list if no answers are found
        except json.JSONDecodeError:
            print(f"Error decoding JSON for answers of question {question_id}. Raw response:", response.text)
            return []
    else:
        print(f"Failed to fetch answers for question {question_id}. HTTP Status Code: {response.status_code}")
        return []

# Save the fetched data to a JSON file
def save_to_json(file_name):
    with open(file_name, 'w', encoding='utf-8') as f:
        json.dump(all_questions_and_answers, f, ensure_ascii=False, indent=4)
    print(f"Data saved to {file_name}")

# Main function to run the script
if __name__ == '__main__':
    print("Fetching Drupal-related questions and answers from Stack Overflow...")
    fetch_drupal_questions()  # Call the function to fetch the questions and answers
    save_to_json('drupal_questions_and_answers.json')  # Save the questions and answers to a JSON file
    print("Scraping complete!")
