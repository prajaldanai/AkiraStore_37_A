🛍️ AkiraStore — Group E-Commerce Project (PERN Stack)

Welcome to AkiraStore, a group project built using the PERN Stack:

PostgreSQL (Database)

Express.js (Backend Framework)

React.js (Frontend UI)

Node.js (Backend Runtime)

This README will help every team member understand how the project works and how to contribute properly.

📁 Project Structure
AkiraStore_37_A/
│
├── backend/
│   ├── controllers/
│   ├── database/
│   │    └── db.js
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   └── server.js
│
├── frontend/
│   ├── public/
│   └── src/
│        ├── assets/
│        ├── components/
│        ├── context/
│        ├── hooks/
│        ├── pages/
│        ├── services/
│        ├── App.js
│        └── index.js
│
├── README.md   ← (THIS FILE)
└── .gitignore

⚙️ Backend Setup (Node + Express)
1️⃣ Go to backend folder
cd backend

2️⃣ Install dependencies
npm install

3️⃣ Create a .env file inside backend

(Must be created by every team member)

DB_USER=postgres
DB_PASSWORD=ENTER_YOUR_OWN_POSTGRES_PASSWORD
DB_HOST=localhost
DB_PORT=5432
DB_NAME=akirastore


⚠️ Everyone must insert their own actual PostgreSQL password.

4️⃣ Start backend server
npm start


If successful, you will see:

Server running on port 5000
Connected to PostgreSQL database successfully

🗄️ Database Setup (PostgreSQL)

Open pgAdmin

Right-click on Databases → Create

Enter:

Database name: akirastore

Owner: postgres

Click Save

That’s it! The backend will automatically connect using db.js.

🎨 Frontend Setup (React)
1️⃣ Go to frontend folder
cd ../frontend

2️⃣ Install frontend dependencies
npm install

3️⃣ Start the React app
npm start


You should see:

Akira Store Frontend Running


at

👉 http://localhost:3000

🔀 Git & Branch Rules (VERY IMPORTANT)

To avoid conflicts and confusion, nobody will push to main directly.

✔ Everyone must create their own branch:

Examples:

git checkout -b prajal-auth
git checkout -b friend1-frontend
git checkout -b friend2-admin
git checkout -b friend3-products

✔ Push your work to your branch:
git add .
git commit -m "Your message"
git push origin your-branch-name

✔ To merge → create a Pull Request (PR)

Go to GitHub repo

Click Pull Requests

Click New Pull Request

Select:

main ← your-branch-name

Submit PR for review

💡 Only merge into main after group agrees.

👥 Team Workflow Guidelines

✔ Do not edit files directly in the main branch
✔ Always pull latest main before starting work
✔ Communicate what you are working on to avoid duplicate work
✔ Keep code clean and readable
✔ Use proper commit messages

📌 What Each Member Can Work On (Suggested)
Member	Responsibility
Prajal	Authentication (Signup/Login), Frontend Structure
Member 2	Admin Panel, Dashboard
Member 3	Product Pages, Categories
Member 4	Cart & Checkout System

(I can modify this table with your real member names.)

🛠 Technologies Used
Backend

Node.js

Express.js

PostgreSQL

pg / pg-pool

dotenv

bcrypt (later for password hashing)

jsonwebtoken (later for auth)

Frontend

React.js

React Router

Axios

Context API

Custom components & hooks

📞 Contact & Help

If you are confused, ask your teammates or Prajal (Project Lead).

If something breaks:

npm install
npm start
Check .env file
Restart PostgreSQL

🎉 Project Status

Backend Server ✔

Database Connection ✔

Frontend Working ✔

Ready for Feature Development 🚀