API Reference
=============

This section contains the full documentation of API endpoints, automatically generated from docstrings.

Основные Endpoints
------------------

.. automodule:: app.main
   :members:
   :undoc-members:
   :show-inheritance:

Authentication
--------------

.. automodule:: app.api.v1.endpoints.auth
   :members:
   :undoc-members:
   :show-inheritance:

Prompts
-------

.. automodule:: app.api.v1.endpoints.prompts
   :members:
   :undoc-members:
   :show-inheritance:

Variables
----------

.. automodule:: app.api.v1.endpoints.variables
   :members:
   :undoc-members:
   :show-inheritance:

History
-------

.. automodule:: app.api.v1.endpoints.history
   :members:
   :undoc-members:
   :show-inheritance:

Users
------------

.. automodule:: app.api.v1.endpoints.users
   :members:
   :undoc-members:
   :show-inheritance:

Monitoring
----------

.. automodule:: app.api.v1.endpoints.monitoring
   :members:
   :undoc-members:
   :show-inheritance:

Data schemas
------------

.. automodule:: app.schemas.auth
   :members:
   :undoc-members:
   :show-inheritance:

.. automodule:: app.schemas.prompt
   :members:
   :undoc-members:
   :show-inheritance:

.. automodule:: app.schemas.variable
   :members:
   :undoc-members:
   :show-inheritance:

.. automodule:: app.schemas.user
   :members:
   :undoc-members:
   :show-inheritance:

API dependencies
---------------

.. automodule:: app.api.deps
   :members:
   :undoc-members:
   :show-inheritance:

Usage examples
---------------------

Prompt optimization
~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   import requests
   
   # Authentication
   auth_response = requests.post("http://localhost:8000/api/v1/auth/login", data={
       "username": "user@example.com",
       "password": "password123"
   })
   token = auth_response.json()["access_token"]
   
   # Prompt optimization
   headers = {"Authorization": f"Bearer {token}"}
   response = requests.post(
       "http://localhost:8000/api/v1/prompts/optimize",
       headers=headers,
       json={"prompt": "Write a blog post about AI"}
   )
   
   result = response.json()
   print(f"Original: {result['original']}")
   print(f"Optimized: {result['optimized']}")
   print(f"Techniques: {result['techniques_used']}")

Saving prompt
~~~~~~~~~~~~~~~~~~

.. code-block:: python

   # Saving optimized prompt
   save_data = {
       "title": "AI Blog Post",
       "original_prompt": "Write a blog post about AI",
       "optimized_prompt": result["optimized"],
       "variables": result["variables"],
       "category": "writing",
       "tags": ["ai", "blog", "technology"],
       "is_template": True,
       "is_public": False
   }
   
   save_response = requests.post(
       "http://localhost:8000/api/v1/prompts/save",
       headers=headers,
       json=save_data
   )
   
   saved_prompt = save_response.json()
   print(f"Saved prompt ID: {saved_prompt['id']}")

Getting user prompts
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   # Getting all user prompts
   prompts_response = requests.get(
       "http://localhost:8000/api/v1/prompts/my",
       headers=headers
   )
   
   prompts = prompts_response.json()
   for prompt in prompts:
       print(f"Title: {prompt['title']}")
       print(f"Category: {prompt['category']}")
       print(f"Usage count: {prompt['usage_count']}")
       print("---")

Creating variable
~~~~~~~~~~~~~~~~~~~

.. code-block:: python

   # Creating variable category
   category_data = {
       "name": "Blog Variables",
       "description": "Variables for blog writing",
       "color": "#3B82F6",
       "icon": "article"
   }
   
   category_response = requests.post(
       "http://localhost:8000/api/v1/variables/categories",
       headers=headers,
       json=category_data
   )
   
   category = category_response.json()
   
   # Creating variable
   variable_data = {
       "name": "topic",
       "description": "Blog topic",
       "default_value": "Technology",
       "type": "text",
       "category_id": category["id"],
       "is_required": True
   }
   
   variable_response = requests.post(
       "http://localhost:8000/api/v1/variables",
       headers=headers,
       json=variable_data
   )
   
   variable = variable_response.json()
   print(f"Created variable: {variable['name']}")

Response codes
------------

+--------+--------------------------------+--------------------------------------------------+
| Code   | Name                           | Description                                      |
+========+================================+==================================================+
| 200    | OK                             | Request completed successfully                   |
+--------+--------------------------------+--------------------------------------------------+
| 201    | Created                        | Resource created successfully                    |
+--------+--------------------------------+--------------------------------------------------+
| 204    | No Content                     | Request completed, but no content to return      |
+--------+--------------------------------+--------------------------------------------------+
| 400    | Bad Request                    | Invalid request                                  |
+--------+--------------------------------+--------------------------------------------------+
| 401    | Unauthorized                   | Unauthorized                                     |
+--------+--------------------------------+--------------------------------------------------+
| 403    | Forbidden                      | Access denied                                    |
+--------+--------------------------------+--------------------------------------------------+
| 404    | Not Found                      | Resource not found                               |
+--------+--------------------------------+--------------------------------------------------+
| 422    | Unprocessable Entity           | Validation error                                 |
+--------+--------------------------------+--------------------------------------------------+
| 429    | Too Many Requests              | Request limit exceeded                           |
+--------+--------------------------------+--------------------------------------------------+
| 500    | Internal Server Error          | Internal server error                            |
+--------+--------------------------------+--------------------------------------------------+

Errors
------

.. automodule:: app.core.exceptions
   :members:
   :undoc-members:
   :show-inheritance:

Validation
---------

.. automodule:: app.core.validators
   :members:
   :undoc-members:
   :show-inheritance:

Utilities
-------

.. automodule:: app.core.utils
   :members:
   :undoc-members:
   :show-inheritance: 