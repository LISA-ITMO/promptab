Services
========

This section contains documentation for all services of PrompTab Backend, automatically generated from docstrings.

Prompt Optimizer
----------------

Main service for optimizing prompts using AI.

.. automodule:: app.services.prompt_optimizer
   :members:
   :undoc-members:
   :show-inheritance:

Examples of usage:

.. code-block:: python

   from app.services.prompt_optimizer import PromptOptimizer
   
   # Creating an optimizer
   optimizer = PromptOptimizer()
   
   # Basic optimization
   result = await optimizer.optimize("Write a blog post about AI")
   print(f"Original: {result['original']}")
   print(f"Optimized: {result['optimized']}")
   print(f"Techniques: {result['techniques_used']}")
   
   # Optimization with context
   result = await optimizer.optimize(
       "Explain machine learning",
       context="For a beginner audience",
       style="educational"
   )

LLM Service
-----------

Service for working with different language models (OpenAI, Anthropic, Ollama).

.. automodule:: app.services.llm_service
   :members:
   :undoc-members:
   :show-inheritance:

Examples of usage:

.. code-block:: python

   from app.services.llm_service import LLMService
   
   # Creating a service
   llm_service = LLMService()
   
   # Generating a response
   response = await llm_service.generate_response(
       "Write a short story about a robot",
       model="gpt-4",
       max_tokens=500
   )
   print(response)
   
   # Analyzing a prompt
   analysis = await llm_service.analyze_prompt("Write a blog post")
   print(f"Intent: {analysis['intent']}")
   print(f"Category: {analysis['category']}")
   print(f"Complexity: {analysis['complexity']}")
   
   # Switching provider
   llm_service.switch_provider("anthropic")
   response = await llm_service.generate_response("Hello, world!")

Vector Store
------------

Service for working with vector store (ChromaDB).

.. automodule:: app.services.vector_store
   :members:
   :undoc-members:
   :show-inheritance:

Examples of usage:

.. code-block:: python

   from app.services.vector_store import VectorStore
   
   # Creating a store
   vector_store = VectorStore()
   
   # Adding a document
   await vector_store.add_document(
       document_id="doc1",
       content="Machine learning is a subset of artificial intelligence",
       metadata={"source": "wikipedia", "category": "ai"}
   )
   
   # Searching for similar documents
   results = await vector_store.search(
       query="What is machine learning?",
       top_k=5
   )
   
   for result in results:
       print(f"ID: {result['id']}")
       print(f"Content: {result['content']}")
       print(f"Similarity: {result['similarity']}")
       print("---")
   
   # Getting a document
   doc = await vector_store.get_document("doc1")
   print(f"Document: {doc['content']}")
   
   # Updating a document
   await vector_store.update_document(
       document_id="doc1",
       content="Updated content about machine learning",
       metadata={"source": "updated", "category": "ai"}
   )
   
   # Deleting a document
   await vector_store.delete_document("doc1")
   
   # Collection statistics
   stats = await vector_store.get_collection_stats()
   print(f"Total documents: {stats['total_documents']}")

Email Service
-------------

Service for sending email notifications.

.. automodule:: app.services.email_service
   :members:
   :undoc-members:
   :show-inheritance:

Examples of usage:

.. code-block:: python

   from app.services.email_service import EmailService
   
   # Creating a service
   email_service = EmailService()
   
   # Sending a welcome email
   await email_service.send_welcome_email(
       email="user@example.com",
       full_name="John Doe"
   )
   
   # Sending a reset password email
   await email_service.send_reset_email(
       email="user@example.com",
       reset_token="abc123",
       full_name="John Doe"
   )
   
   # Sending a verification email
   await email_service.send_verification_email(
       email="user@example.com",
       verification_token="xyz789",
       full_name="John Doe"
   )

Logger Service
--------------

Service for logging events and metrics.

.. automodule:: app.services.logger_service
   :members:
   :undoc-members:
   :show-inheritance:

Examples of usage:

.. code-block:: python

   from app.services.logger_service import LoggerService
   
   # Creating a logger
   logger = LoggerService()
   
   # Logging information
   logger.info("User logged in", user_id="123", email="user@example.com")
   
   # Logging errors
   logger.error("Database connection failed", error="Connection timeout")
   
   # Logging metrics
   logger.metric("prompt_optimization", {
       "duration": 1.5,
       "techniques_used": ["rag", "chain_of_thought"],
       "user_id": "123"
   })
   
   # Logging audit
   logger.audit("prompt_saved", {
       "user_id": "123",
       "prompt_id": "456",
       "action": "create"
   })

Cache Service
-------------

Service for caching data in Redis.

.. automodule:: app.services.cache_service
   :members:
   :undoc-members:
   :show-inheritance:

Examples of usage:

.. code-block:: python

   from app.services.cache_service import CacheService
   
   # Creating a service
   cache = CacheService()
   
   # Setting a value
   await cache.set("user:123", {"name": "John", "email": "john@example.com"}, ttl=3600)
   
   # Getting a value
   user_data = await cache.get("user:123")
   print(user_data)
   
   # Checking existence
   exists = await cache.exists("user:123")
   print(f"Key exists: {exists}")
   
   # Deleting a value
   await cache.delete("user:123")
   
   # Setting with TTL
   await cache.setex("temp:data", 300, {"temp": "value"})
   
   # Incrementing a counter
   count = await cache.incr("api:requests:user:123")
   print(f"Request count: {count}")
   
   # Setting multiple values
   await cache.mset({
       "key1": "value1",
       "key2": "value2",
       "key3": "value3"
   })
   
   # Getting multiple values
   values = await cache.mget(["key1", "key2", "key3"])
   print(values)

Background Tasks
----------------

Service for executing background tasks.

.. automodule:: app.services.background_tasks
   :members:
   :undoc-members:
   :show-inheritance:

Examples of usage:

.. code-block:: python

   from app.services.background_tasks import BackgroundTaskService
   
   # Creating a service
   bg_tasks = BackgroundTaskService()
   
   # Adding a task
   task_id = await bg_tasks.add_task(
       "optimize_prompt",
       {"prompt": "Write a blog post", "user_id": "123"}
   )
   
   # Checking task status
   status = await bg_tasks.get_task_status(task_id)
   print(f"Task status: {status}")
   
   # Getting task result
   result = await bg_tasks.get_task_result(task_id)
   print(f"Task result: {result}")
   
   # Cancelling a task
   await bg_tasks.cancel_task(task_id)
   
   # Getting user tasks
   user_tasks = await bg_tasks.get_user_tasks("123")
   for task in user_tasks:
       print(f"Task: {task['id']}, Status: {task['status']}")

Monitoring Service
------------------

Service for monitoring and metrics.

.. automodule:: app.services.monitoring_service
   :members:
   :undoc-members:
   :show-inheritance:

Examples of usage:

.. code-block:: python

   from app.services.monitoring_service import MonitoringService
   
   # Creating a service
   monitoring = MonitoringService()
   
   # Registering a metric
   monitoring.record_metric("api_requests_total", 1, {"endpoint": "/api/v1/prompts/optimize"})
   
   # Measuring execution time
   with monitoring.timer("prompt_optimization_duration"):
       # Prompt optimization code
       result = await optimizer.optimize("Write a blog post")
   
   # Registering an event
   monitoring.record_event("user_registered", {
       "user_id": "123",
       "email": "user@example.com"
   })
   
   # Getting metrics
   metrics = monitoring.get_metrics()
   print(f"Total API requests: {metrics['api_requests_total']}")
   
   # Checking service health
   health = monitoring.check_health()
   print(f"Service health: {health['status']}")

Configuration Service
---------------------

Service for managing configuration.

.. automodule:: app.services.config_service
   :members:
   :undoc-members:
   :show-inheritance:

Examples of usage:

.. code-block:: python

   from app.services.config_service import ConfigService
   
   # Creating a service
   config = ConfigService()
   
   # Getting configuration
   db_config = config.get_database_config()
   print(f"Database URL: {db_config['url']}")
   
   # Getting LLM configuration
   llm_config = config.get_llm_config()
   print(f"Default provider: {llm_config['default_provider']}")
   
   # Getting security configuration
   security_config = config.get_security_config()
   print(f"JWT secret: {security_config['jwt_secret']}")
   
  # Updating configuration
   config.update_config("llm", {"default_provider": "anthropic"})
   
   # Validating configuration
   is_valid = config.validate_config()
   print(f"Configuration valid: {is_valid}")

Service Factory
---------------

Factory for creating services.

.. automodule:: app.services.service_factory
   :members:
   :undoc-members:
   :show-inheritance:

Examples of usage:

.. code-block:: python

   from app.services.service_factory import ServiceFactory
   
   # Creating a factory
   factory = ServiceFactory()
   
   # Getting an optimizer service
   optimizer = factory.get_prompt_optimizer()
   
   # Getting an LLM service
   llm_service = factory.get_llm_service()
   
   # Getting a vector store
   vector_store = factory.get_vector_store()
   
   # Getting an email service
   email_service = factory.get_email_service()
   
   # Getting a cache service
   cache_service = factory.get_cache_service() 