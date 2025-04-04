# URL Shortener Project

This project is a URL shortener built with Node.js and Firebase. It allows users to shorten URLs and requires authentication to access the shortened URLs.

## Features

- User authentication using Firebase
- Shortening of URLs
- Retrieval of original URLs from shortened links
- Middleware for protecting routes

## Project Structure

```
url-shortener
├── src
│   ├── index.js               # Entry point of the application
│   ├── config
│   │   └── firebase.js        # Firebase configuration and initialization
│   ├── controllers
│   │   ├── authController.js  # Handles user authentication
│   │   └── urlController.js   # Handles URL shortening and retrieval
│   ├── middlewares
│   │   └── authMiddleware.js   # Middleware for route protection
│   ├── models
│   │   └── urlModel.js        # URL model for the database
│   ├── routes
│   │   ├── authRoutes.js      # Authentication routes
│   │   └── urlRoutes.js       # URL shortening routes
│   └── utils
│       └── validator.js       # Utility functions for input validation
├── package.json                # NPM configuration file
├── .env                        # Environment variables
└── README.md                   # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd url-shortener
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Set up your Firebase project and add the configuration details to the `.env` file.

## Usage

1. Start the server:
   ```
   npm start
   ```

2. Use the API endpoints for authentication and URL shortening as documented in the respective controllers.

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.#   U R L - S h o r t n e r - G S O C  
 