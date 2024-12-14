#!/bin/bash

# Create an array of subreddit data
declare -a subreddits=(
  '{"Name": "GatorTech", "Description": "Tech innovations, coding tips, and startup discussions for young developers", "CreatorID": "10089447-3ad0-4dd6-bc1e-b92b7e538e23"}'
  '{"Name": "CampusEats", "Description": "Best food spots, dining hall reviews, and meal hacks around campus", "CreatorID": "2264aec7-29b9-4cda-af58-8e3bb4f18502"}'
  '{"Name": "StudySpaces", "Description": "Find and share quiet study spots, library corners, and cozy cafes", "CreatorID": "10089447-3ad0-4dd6-bc1e-b92b7e538e23"}'
  '{"Name": "GatorSports", "Description": "All things UF sports, game discussions, and athlete spotlights", "CreatorID": "2264aec7-29b9-4cda-af58-8e3bb4f18502"}'
  '{"Name": "StudentLife", "Description": "Navigate college life, from dorm hacks to time management tips", "CreatorID": "10089447-3ad0-4dd6-bc1e-b92b7e538e23"}'
  '{"Name": "CareerGators", "Description": "Internship opportunities, resume tips, and career advice for students", "CreatorID": "2264aec7-29b9-4cda-af58-8e3bb4f18502"}'
  '{"Name": "GatorArts", "Description": "Showcase student artwork, campus performances, and creative projects", "CreatorID": "10089447-3ad0-4dd6-bc1e-b92b7e538e23"}'
  '{"Name": "SwampMemes", "Description": "Fresh memes and humor about campus life and student experiences", "CreatorID": "2264aec7-29b9-4cda-af58-8e3bb4f18502"}'
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