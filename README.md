[![Amplience Dynamic Content](media/header.png)](https://amplience.com/dynamic-content)

# Amplience Dynamic Content Console

![Amplience Dynamic Content Console](media/dc-console.png)

Amplience Dynamic Content Console allows you to navigate your Amplience instance very easily from the command line. 

You can select a hub, repo and go into folders and list content items.

It's also possible to show hub settings, list extensions, webhooks, schemas, types as well.

## Environment setup

### .env file format

Environemnt configuration is done in a local .env file (ignored by git):

```
CLIENT_ID=xxx
CLIENT_SECRET=yyy
HUB_ID=yyy (optional)
```

### Working with multiple environments

You can create multiple .env.<environment name> files locally (ignored by git), and switch using the `env <environment name>` command.

## Entering commands

- tokens with spaces can be surrounded by quotes: `"this is my token"`
- expressions are surrounded with \`\` and can contain spaces: \``2 + 2`\`
- variables are surrounded by double curly braces: `{{myVariable}}`

## Last single result and array results

- last single result is stored in the `result` variable (for instance one schema, type or item)
- last list of results is stored in the `results` variable as an array (for instance a list of content items)

You can use `result` and `results`:
- in the `eval` command (`eval results.length`), 
- or in expressions (\`result.id\`).

## Using variables

Variables are stored in the `context` in `context.variables`. You can use the `setvar` command to set a variable with a value. If you don't specify a value, the variable will be removed.

The `variables` command will show all the variables stored in the context.

Variables using the format `{{myVariable}}` are automatically expanded. For instance in the command `item {{mySavedId}}`.

## Using expressions

Expressions can be used anywhere in the user input. For instance `echo `\``context.variables.mySavedId`\`.

Try \``"ech" + "o"`\` \``results[0].id`\` for fun!

## Supported commands

```
- connect clientId clientSecret [hubId] - connects to an Amplience Dynamic Content instance
- conn - alias for connect
- context - show current context
- client - show client details
- env - switch environment, configuration file in .env.<environment name>
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
### Videos

[Amplience Dynamic Content Console - Video 1](media/dc-console-1.mov)

[Amplience Dynamic Content Console - Video 2](media/dc-console-2.mov)
