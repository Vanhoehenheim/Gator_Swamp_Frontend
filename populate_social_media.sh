#!/bin/bash

# Array to store user IDs
declare -a user_ids=()
# Array to store subreddit IDs
declare -a subreddit_ids=()
# Array to store post IDs
declare -a post_ids=()

# Names for users
declare -a usernames=(
    "techie_gator"
    "campus_foodie"
    "study_master"
    "sports_fan"
    "dorm_life"
    "career_seeker"
    "art_lover"
    "meme_lord"
    "coding_ninja"
    "library_dweller"
)

echo "Creating users..."
for username in "${usernames[@]}"
do
    response=$(curl -s -X POST http://localhost:8080/user/register \
        -H "Content-Type: application/json" \
        -d "{
            \"username\": \"$username\",
            \"email\": \"$username@example.com\",
            \"password\": \"pass1234\",
            \"karma\": 300
        }")
    
    # Extract and store user ID (adjust this based on your actual response format)
    user_id=$(echo $response | jq -r '._id')
    user_ids+=($user_id)
    echo "Created user: $username with ID: $user_id"
    sleep 1
done

# Subreddit data
declare -a subreddits=(
    "GatorTech:Tech innovations, coding tips, and startup discussions for young developers"
    "CampusEats:Best food spots, dining hall reviews, and meal hacks around campus"
    "StudySpaces:Find and share quiet study spots, library corners, and cozy cafes"
    "GatorSports:All things UF sports, game discussions, and athlete spotlights"
    "StudentLife:Navigate college life, from dorm hacks to time management tips"
    "CareerGators:Internship opportunities, resume tips, and career advice for students"
    "GatorArts:Showcase student artwork, campus performances, and creative projects"
    "SwampMemes:Fresh memes and humor about campus life and student experiences"
)

echo -e "\nCreating subreddits..."
for subreddit in "${subreddits[@]}"
do
    IFS=':' read -r name description <<< "$subreddit"
    # Randomly select a user ID as creator
    creator_id=${user_ids[$RANDOM % ${#user_ids[@]}]}
    
    response=$(curl -s -X POST http://localhost:8080/subreddit \
        -H "Content-Type: application/json" \
        -d "{
            \"Name\": \"$name\",
            \"Description\": \"$description\",
            \"CreatorID\": \"$creator_id\"
        }")
    
    # Extract and store subreddit ID
    subreddit_id=$(echo $response | jq -r '._id')
    subreddit_ids+=($subreddit_id)
    echo "Created subreddit: $name with ID: $subreddit_id"
    sleep 1
done

# Join users to random subreddits
echo -e "\nJoining users to subreddits..."
for user_id in "${user_ids[@]}"
do
    # Join 3-5 random subreddits
    num_joins=$((RANDOM % 3 + 3))
    for ((i=0; i<num_joins; i++))
    do
        subreddit_id=${subreddit_ids[$RANDOM % ${#subreddit_ids[@]}]}
        curl -s -X POST http://localhost:8080/subreddit/members \
            -H "Content-Type: application/json" \
            -d "{
                \"UserID\": \"$user_id\",
                \"SubredditID\": \"$subreddit_id\"
            }"
        echo "User $user_id joined subreddit $subreddit_id"
        sleep 1
    done
done

# Create posts
declare -a post_titles=(
    "First Hackathon Experience:Just completed my first hackathon at UF! Here's what I learned..."
    "Best Study Spots:Top 5 quiet places to study during finals week"
    "Career Fair Tips:How I landed 3 interviews at the career fair"
    "Gator Game Day:Amazing atmosphere at the game yesterday!"
    "Meal Prep Guide:How to survive without Krishna Lunch"
    "Coding Workshop:Hosting a free Python workshop next week"
    "Art Exhibition:Check out the new student art gallery"
    "Dorm Life Hacks:10 ways to make your dorm room feel like home"
    "Meme Contest:Submit your best UF memes here"
    "Library Guide:Secret study rooms in Library West"
)

echo -e "\nCreating posts..."
for post_title in "${post_titles[@]}"
do
    IFS=':' read -r title content <<< "$post_title"
    # Random user and subreddit
    author_id=${user_ids[$RANDOM % ${#user_ids[@]}]}
    subreddit_id=${subreddit_ids[$RANDOM % ${#subreddit_ids[@]}]}
    
    response=$(curl -s -X POST http://localhost:8080/post \
        -H "Content-Type: application/json" \
        -d "{
            \"Title\": \"$title\",
            \"Content\": \"$content\",
            \"AuthorID\": \"$author_id\",
            \"SubredditID\": \"$subreddit_id\"
        }")
    
    # Extract and store post ID
    post_id=$(echo $response | jq -r '._id')
    post_ids+=($post_id)
    echo "Created post: $title with ID: $post_id"
    sleep 1
done

# Create comments
echo -e "\nCreating comments..."
declare -a comments=(
    "This is super helpful! Thanks for sharing!"
    "Great post, looking forward to more content like this"
    "Can you provide more details about this?"
    "I had a similar experience last semester"
    "Does anyone want to form a study group?"
    "This changed my university experience!"
    "Saving this for later reference"
    "The real MVP right here"
    "This needs to be pinned"
    "Absolutely agree with this"
)

for post_id in "${post_ids[@]}"
do
    # Add 2-4 random comments per post
    num_comments=$((RANDOM % 3 + 2))
    for ((i=0; i<num_comments; i++))
    do
        comment=${comments[$RANDOM % ${#comments[@]}]}
        author_id=${user_ids[$RANDOM % ${#user_ids[@]}]}
        
        curl -s -X POST http://localhost:8080/comment \
            -H "Content-Type: application/json" \
            -d "{
                \"content\": \"$comment\",
                \"authorId\": \"$author_id\",
                \"postId\": \"$post_id\"
            }"
        echo "Created comment on post $post_id by user $author_id"
        sleep 1
    done
done

echo "Data population complete!"