#!/bin/bash

# Create an array of subreddit data
declare -a subreddits=(
  '{"Name": "DOSP", "Description": "A subreddit to discuss DOSP-Fall 24", "CreatorID": "1ea47acf-da3c-41ab-b32c-4c4ca7518196"}'
  '{"Name": "CampusEats", "Description": "Best food spots, dining hall reviews, and meal hacks around campus", "CreatorID": "386a6dfd-a395-4dae-912e-e60974a110a1"}'
  '{"Name": "StudySpaces", "Description": "Find and share quiet study spots, library corners, and cozy cafes", "CreatorID": "1ea47acf-da3c-41ab-b32c-4c4ca7518196"}'
  '{"Name": "GatorSports", "Description": "All things UF sports, game discussions, and athlete spotlights", "CreatorID": "386a6dfd-a395-4dae-912e-e60974a110a1"}'
  '{"Name": "StudentLife", "Description": "Navigate college life, from dorm hacks to time management tips", "CreatorID": "1ea47acf-da3c-41ab-b32c-4c4ca7518196"}'
  '{"Name": "CareerGators", "Description": "Internship opportunities, resume tips, and career advice for students", "CreatorID": "386a6dfd-a395-4dae-912e-e60974a110a1"}'
  '{"Name": "GatorArts", "Description": "Showcase student artwork, campus performances, and creative projects", "CreatorID": "1ea47acf-da3c-41ab-b32c-4c4ca7518196"}'
  '{"Name": "SwampMemes", "Description": "Fresh memes and humor about campus life and student experiences", "CreatorID": "386a6dfd-a395-4dae-912e-e60974a110a1"}'
)

# Loop through the array and create each subreddit
for subreddit in "${subreddits[@]}"
do
  echo "Creating subreddit: $subreddit"
  curl -X POST http://localhost:8080/subreddit \
    -H "Content-Type: application/json" \
    -d "$subreddit"
  echo -e "\n"
  sleep 1  # Add a small delay between requests
done

echo "All subreddits created!"