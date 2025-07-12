# 📚 Quote API

A simple self-hosted REST API to serve quotes, built with [Bun](https://bun.sh/), Express and SQLite. Supports search, filtering, random selection, and API key authentication.

---

## 🚀 Getting Started

| Method | Endpoint                | Description                      
| ------ | ----------------------- | --------------------------------
| GET    | `/quotes`               | Get paginated list of quotes     
| GET    | `/quotes/:id`           | Get a quote by its ID            
| GET    | `/quotes/random`        | Get a random quote               
| GET    | `/quotes/search`        | Search quotes by text (`?q=...`) 
| GET    | `/quotes/category/:tag` | Filter quotes by category/tag    
| GET    | `/quotes/author/:name`  | Filter quotes by author          
| GET    | `/quotes/length`        | Filter quotes by quote length    
| GET    | `/quotes/stats`         | Get total stats                  
