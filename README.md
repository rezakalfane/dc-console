# Amplience Dynamic Content Console

Amplience Dynamic Content Console allows you to navigate your Amplience instance very easily from the command line. 

You can select a hub, repo and go into folders and list content items.

It's also possible to show hub settings, list extensions, webhooks, schemas, types as well.

## Supported commands

conn - connect,

```
- connect clientId clientSecret [hubId] - connects to an Amplience Dynamic Content instance
- context - show current context
- client - show client details
- eval - evaluate a javascript expression, you can access objects like client, context, result, results
- hubs - list all hubs
- hub [hub id, name or label] - select a hub
- settings - show hub settings
- schemas - get all schemas
- schema schemaId - get a schema,
- types - get all content types
- type id - get a content type
- repos - get all repositories
- repo [repo id or name] - select a repository
- folders - get all folders in the current repo or folder
- folder ['' | folder id or name | '..]-  select a folder, reset folder is no parameter or go up to the parent folder using '..'
- cd - select a folder, alias for folder
- ls - do both list folders and list content items in the current repo or folder
- items - get all content items in the current repo or folder
- item - get Item By Id
- cat - get Item By Id
- extensions - get all Extensions
- extension name - get Extension
- webhooks - get all Webhooks
- webhook id - get Webhook
- exit - exit
- quit - exit
- bye - exit
```