Getting Started
==============

Quick start with PrompTab Backend API.

Installation
---------

Prerequisites
~~~~~~~~~~~~~~~~~~~~~~~~~~

* Python 3.11+
* PostgreSQL 13+
* Redis 6+
* Docker (optional)

Installation dependencies
~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Clone repository
   git clone https://github.com/promptab/promptab.git
   cd promptab/backend
   
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # or
   venv\Scripts\activate     # Windows
   
   # Install dependencies
   pip install -r requirements.txt

Database setup
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Create PostgreSQL database
   createdb promptab_db
   
   # Apply migrations
   alembic upgrade head
   
   # Create superuser
   python -m app.scripts.create_superuser

Environment variables setup
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Create `.env` file in the root backend directory:

.. code-block:: env

   # Database
   DATABASE_URL=postgresql://user:password@localhost/promptab_db
   
   # Redis
   REDIS_URL=redis://localhost:6379
   
   # Security
   SECRET_KEY=your-secret-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   
   # LLM Providers
   OPENAI_API_KEY=your-openai-api-key
   ANTHROPIC_API_KEY=your-anthropic-api-key
   
   # Email
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   
   # Vector Store
   CHROMA_HOST=localhost
   CHROMA_PORT=8000
   
   # Monitoring
   PROMETHEUS_PORT=9090
   GRAFANA_PORT=3000

Server start
~~~~~~~~~~~~~~

.. code-block:: bash

   # Development
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   
   # Production
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

Installation check
~~~~~~~~~~~~~~~~~~

Open browser and go to:
- API документация: http://localhost:8000/docs
- Альтернативная документация: http://localhost:8000/redoc
- Мониторинг: http://localhost:8000/metrics

First steps
-----------

User registration
~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   import requests
   
   # Registration of a new user
   response = requests.post("http://localhost:8000/api/v1/auth/register", json={
       "email": "user@example.com",
       "password": "securepassword123",
       "full_name": "John Doe"
   })
   
   if response.status_code == 201:
       print("User registered successfully!")
       user_data = response.json()
       print(f"User ID: {user_data['id']}")

Authentication
~~~~~~~~~~~~~~

.. code-block:: python

   # Login to the system
   login_response = requests.post("http://localhost:8000/api/v1/auth/login", data={
       "username": "user@example.com",
       "password": "securepassword123"
   })
   
   if login_response.status_code == 200:
       token_data = login_response.json()
       access_token = token_data["access_token"]
       print(f"Access token: {access_token}")
   
   # Using token for authorized requests
   headers = {"Authorization": f"Bearer {access_token}"}

First prompt optimization
~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   # Prompt optimization
   optimize_response = requests.post(
       "http://localhost:8000/api/v1/prompts/optimize",
       headers=headers,
       json={"prompt": "Write a blog post about artificial intelligence"}
   )
   
   if optimize_response.status_code == 200:
       result = optimize_response.json()
       print(f"Original prompt: {result['original']}")
       print(f"Optimized prompt: {result['optimized']}")
       print(f"Techniques used: {result['techniques_used']}")

Saving prompt
~~~~~~~~~~~~~~~~~~

.. code-block:: python

   # Saving optimized prompt
   save_response = requests.post(
       "http://localhost:8000/api/v1/prompts/save",
       headers=headers,
       json={
           "title": "AI Blog Post",
           "original_prompt": result["original"],
           "optimized_prompt": result["optimized"],
           "variables": result["variables"],
           "category": "writing",
           "tags": ["ai", "blog", "technology"],
           "is_template": True,
           "is_public": False
       }
   )
   
   if save_response.status_code == 201:
       saved_prompt = save_response.json()
       print(f"Prompt saved with ID: {saved_prompt['id']}")

Getting prompts
~~~~~~~~~~~~~~~~~~

.. code-block:: python

   # Getting all user prompts
   prompts_response = requests.get(
       "http://localhost:8000/api/v1/prompts/my",
       headers=headers
   )
   
   if prompts_response.status_code == 200:
       prompts = prompts_response.json()
       print(f"Total prompts: {len(prompts)}")
       
       for prompt in prompts:
           print(f"- {prompt['title']} ({prompt['category']})")

Creating variables
~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   # Creating variable category
   category_response = requests.post(
       "http://localhost:8000/api/v1/variables/categories",
       headers=headers,
       json={
           "name": "Blog Variables",
           "description": "Variables for blog writing",
           "color": "#3B82F6",
           "icon": "article"
       }
   )
   
   if category_response.status_code == 201:
       category = category_response.json()
       
       # Creating variable
       variable_response = requests.post(
           "http://localhost:8000/api/v1/variables",
           headers=headers,
           json={
               "name": "topic",
               "description": "Blog topic",
               "default_value": "Technology",
               "type": "text",
               "category_id": category["id"],
               "is_required": True
           }
       )
       
       if variable_response.status_code == 201:
           variable = variable_response.json()
           print(f"Variable created: {variable['name']}")

Docker installation
---------------

Using Docker Compose
~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Clone repository
   git clone https://github.com/promptab/promptab.git
   cd promptab
   
   # Start all services
   docker-compose up -d
   
   # Check status
   docker-compose ps
   
   # View logs
   docker-compose logs -f backend

Individual containers
~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Build image
   docker build -t promptab-backend ./backend
   
   # Start container
   docker run -d \
     --name promptab-backend \
     -p 8000:8000 \
     -e DATABASE_URL=postgresql://user:pass@host/db \
     -e REDIS_URL=redis://host:6379 \
     promptab-backend

Integration with frontend
-----------------------

CORS setup
~~~~~~~~~~~~~~

CORS is already configured in the `app/main.py` file:

.. code-block:: python

   from fastapi.middleware.cors import CORSMiddleware
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000"],  # Frontend URL
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )

Integration example
~~~~~~~~~~~~~~~~~

.. code-block:: javascript

   // Frontend JavaScript/TypeScript
   const API_BASE_URL = 'http://localhost:8000/api/v1';
   
   // Authentication
   async function login(email, password) {
       const response = await fetch(`${API_BASE_URL}/auth/login`, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/x-www-form-urlencoded',
           },
           body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
       });
       
       if (response.ok) {
           const data = await response.json();
           localStorage.setItem('access_token', data.access_token);
           return data;
       }
       throw new Error('Login failed');
   }
   
   // Prompt optimization
   async function optimizePrompt(prompt) {
       const token = localStorage.getItem('access_token');
       const response = await fetch(`${API_BASE_URL}/prompts/optimize`, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               'Authorization': `Bearer ${token}`
           },
           body: JSON.stringify({ prompt })
       });
       
       if (response.ok) {
           return await response.json();
       }
       throw new Error('Optimization failed');
   }

Monitoring and logging
------------------------

Prometheus metrics
~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # View metrics
   curl http://localhost:8000/metrics
   
   # Basic metrics:
   # - promptab_api_requests_total
   # - promptab_prompt_optimizations_total
   # - promptab_response_time_seconds
   # - promptab_active_users_total

Grafana dashboards
~~~~~~~~~~~~~~~~

1. Open Grafana: http://localhost:3000
2. Login with credentials: admin/admin
3. Add Prometheus as a data source
4. Import ready dashboards

Logging
~~~~~~~~~~~

.. code-block:: python

   from app.core.logger import logger
   
   # Logging information
   logger.info("User action", user_id="123", action="prompt_optimized")
   
   # Logging errors
   logger.error("API error", error="Database connection failed")
   
   # Logging metrics
   logger.metric("api_request", {"endpoint": "/api/v1/prompts/optimize"})

Debugging
-------

Enable debug mode
~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Set environment variable
   export DEBUG=true
   
   # Start with detailed logs
   uvicorn app.main:app --reload --log-level debug

Service health check
~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: bash

   # Check API status
   curl http://localhost:8000/health
   
   # Check database
   curl http://localhost:8000/health/db
   
   # Check Redis
   curl http://localhost:8000/health/redis

Profiling
~~~~~~~~~~~~~~

.. code-block:: python

   import cProfile
   import pstats
   
   # Profiling function
   profiler = cProfile.Profile()
   profiler.enable()
   
   # Your code here
   result = await optimizer.optimize("Test prompt")
   
   profiler.disable()
   stats = pstats.Stats(profiler)
   stats.sort_stats('cumulative')
   stats.print_stats(10)