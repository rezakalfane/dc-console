# Amplience Dynamic Content Console

Amplience Dynamic Content Console allows you to navigate your Amplience instance very easily from the command line. 

You can select a hub, repo and go into folders and list content items.

It's also possible to show hub settings, list extensions, webhooks, schemas, types as well.

## Supported commands

```
- connect clientId clientSecret [hubId] - connects to an Amplience Dynamic Content instance
- conn - alias for connect
- context - show current context
- client - show client details
- eval - evaluate a javascript expression, you can access objects like client, context, result, 
    results
- hubs - list all hubs, save array in results
- hub [hub id, name or label] - select a hub, save hub in result
- settings - show hub settings, save settings in result
- schemas - get all schemas, save array in results
- schema schemaId - get a schema, save schema in result
- types - get all content types, save array in results
- type id - get a content type, save type in result
- repos - get all repositories, save array in results
- repo [repo id or name] - select a repository, save repository in result
- folders - get all folders in the current repo or folder, save array in results
- folder ['' | folder id or name | '..]-  select a folder, reset folder is no parameter or go 
    up to the parent folder using '..', save folder in result
- cd - alias for folder
- ls - do both list folders and list content items in the current repo or folder, only save 
    items in results
- items - get all content items in the current repo or folder, save arry in results
- item id - get content item by id, save item in result
- cat - alias for item
- extensions - get all extensions, save array in results
- extension name - get extension by name, save extension in result
- webhooks - get all webhooks, save array in results
- webhook id - get webhook by id, save webhook in result
- exit - exit
- quit - exit
- bye - exit
```