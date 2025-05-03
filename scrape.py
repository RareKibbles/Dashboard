from flask import Flask, jsonify, render_template
import requests
from bs4 import BeautifulSoup
import matplotlib.pyplot as plt
import io
import base64
import json

app = Flask(__name__)

# Function to scrape data from a website
# Function to scrape data from the website
def scrape_website():
    # URL of the target website
    url = "https://www.scrapethissite.com/pages/simple/"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Extract the table containing country data
    table = soup.find('table', {'class': 'table'})
    capital = []
    population = []

    if table:
        rows = table.find_all('tr')[2:]  # Skip the header row
        for row in rows:
            cols = row.find_all('td')
            if len(cols) >= 2:  # Ensure there are enough columns
                capital.append(cols[1].text.strip())  # Capital name (2nd column)
                population.append(float(cols[2].text.strip()))  # Population (3rd column)

    return capital, population

# Function to scrape Kaggle dataset page
def scrape_kaggle_dataset():
    # URL of the Kaggle dataset page
    url = "https://www.kaggle.com/datasets/skihikingkevin/online-p2p-lending"

    # Send a GET request to the URL
    response = requests.get(url)

    # Check if the request was successful
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract relevant data (e.g., dataset description, metadata)
        dataset_title = soup.find('h1').text.strip() if soup.find('h1') else "No title found"
        dataset_description = soup.find('p').text.strip() if soup.find('p') else "No description found"

        # Save the extracted data to a JSON file
        scraped_data = {
            "title": dataset_title,
            "description": dataset_description
        }

        with open('scraped_data.json', 'w') as file:
            json.dump(scraped_data, file, indent=4)

        print("Data scraped and saved to scraped_data.json")
    else:
        print(f"Failed to fetch the page. Status code: {response.status_code}")

# Route to display the dashboard
@app.route('/')
def dashboard():
    # Scrape the data
    capital, population = scrape_website()

    # Generate the bar graph
    plt.figure(figsize=(15, 12))
    plt.bar(capital, population, color='skyblue')
    plt.xlabel('Capitals')
    plt.ylabel('Population')
    plt.title('Country Capitals and Population')
    plt.xticks(rotation=45)

    # Save the plot to a BytesIO object
    img = io.BytesIO()
    plt.savefig(img, format='png')
    img.seek(0)
    graph_url = base64.b64encode(img.getvalue()).decode()

    # Pass the data and graph URL to the template
    return render_template('index.html', graph_url=graph_url, data=zip(capital, population))
# API route to get the scraped data as JSON
@app.route('/api/data')

def api_data():
    capital, population = scrape_website()
    data = {'capital': capital, 'ratings': population}
    return jsonify(data)