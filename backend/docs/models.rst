Models
======

This section contains documentation for all database models of PrompTab Backend, automatically generated from docstrings.

User Model
----------

User model.

.. automodule:: app.models.user
   :members:
   :undoc-members:
   :show-inheritance:

Examples of usage:

.. code-block:: python

   from app.models.user import User
   from app.core.security import get_password_hash
   
   # Creating a new user
   user = User(
       email="john@example.com",
       hashed_password=get_password_hash("securepassword123"),
       full_name="John Doe",
       is_active=True,
       is_verified=True
   )
   
   # Saving to the database
   db.add(user)
   await db.commit()
   await db.refresh(user)
   
   print(f"User ID: {user.id}")
   print(f"Email: {user.email}")
   print(f"Created at: {user.created_at}")
   
   # Checking activity
   if user.is_active:
       print("User is active")
   
   # Checking verification
   if user.is_verified:
       print("User is verified")

UserPrompt Model
----------------

User prompt model.

.. automodule:: app.models.prompt
   :members:
   :undoc-members:
   :show-inheritance:

Examples of usage:

.. code-block:: python

   from app.models.prompt import UserPrompt
   
   # Creating a prompt
   prompt = UserPrompt(
       user_id=user.id,
       title="AI Blog Post Template",
       original_prompt="Write a blog post about {{topic}}",
       optimized_prompt="Create an engaging blog post about {{topic}} with examples and insights",
       variables=[
           {"name": "topic", "description": "Blog topic", "type": "text", "required": True}
       ],
       category="writing",
       tags=["blog", "ai", "template"],
       is_template=True,
       is_public=False
   )
   
   # Saving the prompt
   db.add(prompt)
   await db.commit()
   await db.refresh(prompt)
   
   print(f"Prompt ID: {prompt.id}")
   print(f"Title: {prompt.title}")
   print(f"Category: {prompt.category}")
   print(f"Usage count: {prompt.usage_count}")
   
   # Incrementing the usage counter
   prompt.usage_count += 1
   await db.commit()
   
   # Checking template
   if prompt.is_template:
       print("This is a template prompt")
   
   # Checking public
   if prompt.is_public:
       print("This prompt is public")

PromptHistory Model
-------------------

Prompt history model.

.. automodule:: app.models.prompt
   :members:
   :undoc-members:
   :show-inheritance:

Examples of usage:

.. code-block:: python

   from app.models.prompt import PromptHistory
   
   # Creating a history record
   history = PromptHistory(
       user_id=user.id,
       session_id="session_123",
       original_prompt="Write a blog post about AI",
       optimized_prompt="Create an engaging blog post about AI with examples and insights",
       techniques_used=["rag", "chain_of_thought", "role_playing"],
       rag_sources=[
           {"id": "doc1", "content": "AI is transforming industries", "similarity": 0.9}
       ],
       variables=[{"name": "topic", "value": "AI"}],
       metadata={
           "model": "gpt-4",
           "tokens_used": 150,
           "optimization_time": 2.5
       }
   )
   
   # Saving the history
   db.add(history)
   await db.commit()
   
   print(f"History ID: {history.id}")
   print(f"Session ID: {history.session_id}")
   print(f"Techniques used: {history.techniques_used}")
   print(f"Created at: {history.created_at}")

Variable Model
--------------

Prompt variable model.

.. automodule:: app.models.variable
   :members:
   :undoc-members:
   :show-inheritance:

Examples of usage:

.. code-block:: python

   from app.models.variable import Variable
   
   # Creating a variable
   variable = Variable(
       user_id=user.id,
       name="topic",
       description="Blog topic or subject",
       default_value="Technology",
       type="text",
       category_id=category.id,
       is_required=True,
       validation_rules={"min_length": 3, "max_length": 100}
   )
   
   # Saving the variable
   db.add(variable)
   await db.commit()
   await db.refresh(variable)
   
   print(f"Variable ID: {variable.id}")
   print(f"Name: {variable.name}")
   print(f"Type: {variable.type}")
   print(f"Required: {variable.is_required}")
   
   # Checking required
   if variable.is_required:
       print("This variable is required")
   
   # Incrementing the usage counter
   variable.usage_count += 1
   await db.commit()

VariableCategory Model
----------------------

Variable category model.

.. automodule:: app.models.variable
   :members:
   :undoc-members:
   :show-inheritance:

Examples of usage:

.. code-block:: python

   from app.models.variable import VariableCategory
   
   # Creating a category
   category = VariableCategory(
       user_id=user.id,
       name="Blog Variables",
       description="Variables for blog writing",
       color="#3B82F6",
       icon="article"
   )
   
   # Saving the category
   db.add(category)
   await db.commit()
   await db.refresh(category)
   
   print(f"Category ID: {category.id}")
   print(f"Name: {category.name}")
   print(f"Color: {category.color}")
   print(f"Icon: {category.icon}")
   
   # Getting variables of the category
   variables = category.variables
   print(f"Variables in category: {len(variables)}")
   
   for var in variables:
       print(f"- {var.name}: {var.description}")

Database Configuration
----------------------

Database configuration.

.. automodule:: app.core.database
   :members:
   :undoc-members:
   :show-inheritance:

Examples of usage:

.. code-block:: python

   from app.core.database import get_db, engine
   from app.models.user import User
   
   # Getting database session
   async for db in get_db():
       # Creating a user
       user = User(
           email="test@example.com",
           hashed_password="hashed_password"
       )
       db.add(user)
       await db.commit()
       await db.refresh(user)
       
       # Searching for a user
       found_user = await db.get(User, user.id)
       print(f"Found user: {found_user.email}")
       
       # Updating the user
       found_user.full_name = "Updated Name"
       await db.commit()
       
       # Deleting the user
       await db.delete(found_user)
       await db.commit()

Migrations
----------

Database migrations management.

.. automodule:: app.core.migrations
   :members:
   :undoc-members:
   :show-inheritance:

Examples of usage:

.. code-block:: bash

   # Creating a new migration
   alembic revision --autogenerate -m "Add user table"
   
   # Applying migrations
   alembic upgrade head
   
   # Rolling back the migration
   alembic downgrade -1
   
   # Viewing migration history
   alembic history
   
   # Checking the current state
   alembic current

Model Relationships
-------------------

Relationships between models.

.. code-block:: python

   # User and his prompts
   user = await db.get(User, user_id)
   user_prompts = user.prompts
   
   for prompt in user_prompts:
       print(f"Prompt: {prompt.title}")
       print(f"Category: {prompt.category}")
   
   # Prompt and its variables
   prompt = await db.get(UserPrompt, prompt_id)
   prompt_variables = prompt.variables
   
   # Category and its variables
   category = await db.get(VariableCategory, category_id)
   category_variables = category.variables
   
   for variable in category_variables:
       print(f"Variable: {variable.name}")
       print(f"Type: {variable.type}")

Model Validation
----------------

Model validation.

.. code-block:: python

   from pydantic import ValidationError
   from app.schemas.user import UserCreate
   
   # User data validation
   try:
       user_data = UserCreate(
           email="invalid-email",
           password="123",
           full_name=""
       )
   except ValidationError as e:
       print("Validation errors:")
       for error in e.errors():
           print(f"- {error['loc']}: {error['msg']}")
   
   # Prompt validation
   from app.schemas.prompt import PromptCreate
   
   try:
       prompt_data = PromptCreate(
           title="",
           original_prompt="Valid prompt",
           optimized_prompt="Valid optimized prompt"
       )
   except ValidationError as e:
       print("Prompt validation errors:")
       for error in e.errors():
           print(f"- {error['loc']}: {error['msg']}")

Model Queries
-------------

Examples of queries to models.

.. code-block:: python

   from sqlalchemy import select
   from app.models.user import User
   from app.models.prompt import UserPrompt
   
   # Searching for a user by email
   stmt = select(User).where(User.email == "user@example.com")
   result = await db.execute(stmt)
   user = result.scalar_one_or_none()
   
   # Searching for user prompts
   stmt = select(UserPrompt).where(
       UserPrompt.user_id == user_id,
       UserPrompt.is_template == True
   )
   result = await db.execute(stmt)
   templates = result.scalars().all()
   
   # Searching for public prompts
   stmt = select(UserPrompt).where(UserPrompt.is_public == True)
   result = await db.execute(stmt)
   public_prompts = result.scalars().all()
   
   # Searching by category
   stmt = select(UserPrompt).where(UserPrompt.category == "writing")
   result = await db.execute(stmt)
   writing_prompts = result.scalars().all()
   
   # Searching with limit and sorting
   stmt = select(UserPrompt).order_by(
       UserPrompt.usage_count.desc()
   ).limit(10)
   result = await db.execute(stmt)
   top_prompts = result.scalars().all()

Model Events
------------

Model events (hooks).

.. code-block:: python

   from sqlalchemy import event
   from app.models.user import User
   
   # Event before creating a user
   @event.listens_for(User, 'before_insert')
   def before_insert(mapper, connection, target):
       print(f"Creating user: {target.email}")
   
   # Event after updating the user
   @event.listens_for(User, 'after_update')
   def after_update(mapper, connection, target):
       print(f"Updated user: {target.email}")
   
   # Event before deleting the prompt
   @event.listens_for(UserPrompt, 'before_delete')
   def before_delete_prompt(mapper, connection, target):
       print(f"Deleting prompt: {target.title}")

Model Indexes
-------------

Indexes for optimizing queries.

.. code-block:: python

   # Index for searching by email
   # Index is already defined in the User model
   # email = Column(String, unique=True, index=True)
   
   # Index for searching user prompts
   # Index is already defined in the UserPrompt model
   # user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
   
   # Composite index for searching by category and public
   # Index is already defined in the UserPrompt model
   # __table_args__ = (
   #     Index('idx_category_public', 'category', 'is_public'),
   # )
   
   # Index for searching by tags
   # Index is already defined in the UserPrompt model
   # tags = Column(JSON, index=True) 