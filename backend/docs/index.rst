PrompTab Backend Documentation
==============================

.. image:: https://img.shields.io/badge/Python-3.11+-blue.svg
   :target: https://python.org
   :alt: Python 3.11+

.. image:: https://img.shields.io/badge/FastAPI-0.100+-green.svg
   :target: https://fastapi.tiangolo.com
   :alt: FastAPI 0.100+

.. image:: https://img.shields.io/badge/SQLAlchemy-2.0+-red.svg
   :target: https://sqlalchemy.org
   :alt: SQLAlchemy 2.0+

.. image:: https://img.shields.io/badge/License-MIT-yellow.svg
   :target: LICENSE
   :alt: MIT License

**PrompTab Backend** - is an API server for prompt optimization using prompt engineering techniques, including RAG (Retrieval-Augmented Generation), Chain-of-Thought, Role-playing and Few-shot learning.

.. toctree::
   :maxdepth: 2
   :caption: Contents:

   getting_started
   api_reference
   services
   models
   authentication
   deployment
   testing
   contributing

Quick start
-------------

.. code-block:: python

   from app.main import app
   from app.services.prompt_optimizer import PromptOptimizer
   
   # Create optimizer
   optimizer = PromptOptimizer()
   
   # Prompt optimization
   result = await optimizer.optimize("Write a blog post about AI")
   print(result["optimized"])

Installation
---------

.. code-block:: bash

   # Clone repository
   git clone https://github.com/promptab/promptab.git
   cd promptab/backend
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Start server
   uvicorn app.main:app --reload

Main features
-------------------

* **Prompt optimization** - Automatic prompt optimization using AI
* **RAG integration** - Search for relevant information for context
* **Multiple LLM** - Support OpenAI, Perplexity, Ollama
* **Vector store** - PostgreSQL with pgvector extension
* **Authentication** - JWT tokens and security
* **API documentation** - Automatic generation of OpenAPI/Swagger
* **Monitoring** - Prometheus metrics and Grafana dashboards

Architecture
-----------

.. image:: _static/architecture.png
   :alt: PrompTab Backend Architecture
   :align: center

Technical stack
-------------------

* **FastAPI** - Web framework for Python
* **SQLAlchemy 2.0** - ORM for working with the database
* **PostgreSQL** - Main database
* **Redis** - Caching and sessions
* **Docker** - Containerization
* **Prometheus/Grafana** - Monitoring

License
--------

This project is licensed under MIT License - see the `LICENSE` file for details.


Индексы и таблицы
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search` 