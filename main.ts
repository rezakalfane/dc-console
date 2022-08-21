import { DynamicContent, Folder, Hub, ContentItem, Extension, FacetQuery, Status, ContentRepository, ContentTypeSchema, ContentType, HalResource, Page, Pageable, Settings, Sortable, Webhook } from 'dc-management-sdk-js'
import * as dotenv from 'dotenv';
var pjson = require('./package.json');
const prompt = require('prompt-sync')({ sigint: true })

// Load config from .env file
dotenv.config();

// Terminal colors
const Reset = "\x1b[0m"
const Bright = "\x1b[1m"
const Dim = "\x1b[2m"
const Underscore = "\x1b[4m"
const Blink = "\x1b[5m"
const Reverse = "\x1b[7m"
const Hidden = "\x1b[8m"
const FgBlack = "\x1b[30m"
const FgRed = "\x1b[31m"
const FgGreen = "\x1b[32m"
const FgYellow = "\x1b[33m"
const FgBlue = "\x1b[34m"
const FgMagenta = "\x1b[35m"
const FgCyan = "\x1b[36m"
const FgWhite = "\x1b[37m"
const BgBlack = "\x1b[40m"
const BgRed = "\x1b[41m"
const BgGreen = "\x1b[42m"
const BgYellow = "\x1b[43m"
const BgBlue = "\x1b[44m"
const BgMagenta = "\x1b[45m"
const BgCyan = "\x1b[46m"
const BgWhite = "\x1b[47m"

let client: DynamicContent
let quit = false

interface Command {
    (args: any[]): Promise<void>
}

/**
 * Prepare all tokens, expand variables, evaluate expressions
 * 
 * @param tokens tokens from user prompt
 * @returns prepared tokens
 */
const prepareTokens = (tokens: string[]) => {
    return tokens.map((item: string) => {
        item = item.replace(/\\s/g, ' ')
        if (item.startsWith('{{') && item.endsWith('}}')) {
            const variable = item.substring(2, item.length -2)
            const storeVariable = context.variables[variable]
            if (storeVariable) return storeVariable as string
            else return item
        } else if (item.startsWith("`") && item.endsWith("`")) {
            const expression = item.substring(1, item.length - 1)
            try {
                return eval(expression) as string
            } catch (error: any) {
                return error.message
            }
            
        } else if (item.startsWith('"') && item.endsWith('"')) {
            return item.substring(1, item.length - 1)
        } else {
            return item
        }
    })
}

/**
 * Paginate results from management sdk
 * 
 * @param pagableFn 
 * @param options 
 * @returns 
 */
const paginator = async <T extends HalResource>(
    pagableFn: (options?: Pageable & Sortable) => Promise<Page<T>>,
    options: Pageable & Sortable = {}
): Promise<T[]> => {
    const currentPage = await pagableFn({ ...options, size: 20 })
    if (
        currentPage.page &&
        currentPage.page.number !== undefined &&
        currentPage.page.totalPages !== undefined &&
        currentPage.page.number + 1 < currentPage.page.totalPages
    ) {
        return [
            ...currentPage.getItems(),
            ...(await paginator(pagableFn, { ...options, page: currentPage.page.number + 1 }))
        ]
    }
    return currentPage.getItems()
}

/**
 * Last single result
 */
let result: any

/**
 * Last array result (for instance, list of items)
 */
let results: any[]

/**
 * Global context
 */ 
let context: any = {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    hubId: process.env.HUB_ID,
    repoId: process.env.REPO_ID,
    variables: {}
}

/**
 * Connect to Amplience Dynamic Content instance
 * 
 * @param args client id, client secret, hub id
 */
const connect: Command = async (
    args: string[]
) => {
    console.log('Connecting to Dynamic Content...')
    client = new DynamicContent({
        client_id: args[0],
        client_secret: args[1]
    })
    if (args.length >= 3) {
        await getHub([args[2]])
    }
}

/**
 * Display Amplience Client details
 */
const showClient: Command = async () => {
    console.log(client)
}

/**
 * Show context information
 */
const showContext: Command = async () => {
    console.log(context)
}

/**
 * Showing all variables
 */
const showVariables: Command = async () => {
    console.log(context.variables)
}

/**
 * Printing tokens after preparation (expanding variables, evaluating expressions)
 * 
 * @param args tokens
 */
const echo: Command = async (args: string[]) => {
    if (args.length>0) console.log(args.join(' '))
}

/**
 * Store a variablem or remove variable if value is empty
 * 
 * @param args variable name, variable value
 */
const setVariable: Command = async (args: string[]) => {
    if (args.length>0) {
        if (args.length == 1) {
            delete context.variables[args[0]]
        } else if (args.length == 2) {
            context.variables[args[0]] = args[1]
        }
    }
}

/**
 * Evaluate a javascript expression, access to context, client, result, results
 * 
 * @param args Expression
 */
const evalExpression: Command = async (args: string[]) => {
    const expression = args.join(' ')
    const evalResult = eval(expression)
    console.log(evalResult)
}

/**
 * List all hubs
 */
const listHubs: Command = async () => {
    const hubs: Hub[] = await paginator(client.hubs.list)
    hubs.forEach((hub: Hub) => {
        console.log(`${FgGreen}${hub.label}${Reset} : ${FgGreen}${hub.name}${Reset} : ${Dim}${hub.id}${Reset}`)
    })
    results = hubs
}

/**
 * Get a hub by id, name or beginning of name
 * 
 * @param args id, name or beginning of name
 */
const getHub: Command = async (args: string[]) => {
    if (args.length > 0) {
        let hub: Hub
        const hubs: Hub[] = await paginator(client.hubs.list)
        let filterHubs: Hub[] = hubs.filter(item => item.name == args[0])
        if (filterHubs.length == 0) {
            filterHubs = hubs.filter(item => item.name?.startsWith(args[0]))
        }
        if (filterHubs.length>0) {
            hub = filterHubs[0]
        } else {
            hub = await client.hubs.get(args[0])
        }
        if (hub) {
            result = hub
            context.hub = hub
            delete context.repo
            delete context.folder
            console.log(`${FgGreen}${hub.label}${Reset} : ${FgGreen}${hub.name}${Reset} : ${Dim}${hub.id}${Reset}`)
        }
    }
}

/**
 * Get hub settings
 */
const getHubSettings: Command = async () => {
    if (context.hub) {
        const settings = context.hub.settings
        result = settings
        context.settings = settings
        console.log(JSON.stringify(settings,null,4))
    }
}

/**
 * Get a list of all schemas
 */
const getSchemas: Command = async () => {
    if (context.hub) {
        const currentHub: Hub = context.hub 
        const schemas: ContentTypeSchema[] = await paginator(currentHub.related.contentTypeSchema.list)
        const schemasFilter = schemas.filter((item: ContentTypeSchema) => item.status == Status.ACTIVE)
        schemasFilter
            .forEach((item: ContentTypeSchema) => { console.log(`${FgCyan}${item.schemaId}${Reset}`) })
        results = schemasFilter
    }
}

/**
 * Get a schema by schema id
 * 
 * @param args schema id
 */
const getSchema: Command = async (args: string[]) => {
    if (context.hub) {
        const currentHub: Hub = context.hub 
        const schemas: ContentTypeSchema[] = await paginator(currentHub.related.contentTypeSchema.list)
        const filterSchemas: ContentTypeSchema[] = schemas.filter((item: ContentTypeSchema) => item.schemaId == args[0])
        if (filterSchemas.length>0) {
            const schema = filterSchemas[0]
            result = filterSchemas
            const itemAny: any = schema
            delete itemAny._links
            delete itemAny.related
            delete itemAny.client
            console.log(JSON.stringify(itemAny,null,4))
        }
    }
}

/**
 * Get all content types
 */
const getTypes: Command = async () => {
    if (context.hub) {
        const currentHub: Hub = context.hub 
        const types: ContentType[] = await paginator(currentHub.related.contentTypes.list)
        const typesFilter = types.filter((item: ContentType) => item.status == Status.ACTIVE)
        typesFilter
            .forEach((item: ContentType) => { console.log(`${FgBlue}${item.settings?.label}${Reset} : ${FgCyan}${item.contentTypeUri}${Reset} : ${Dim}${item.id}${Reset}`) })
        results = typesFilter
    }
}

/**
 * Get a type by id
 * 
 * @param args type id
 */
const getType: Command = async (args: string[]) => {
    if (context.hub && args.length>0) {
        const currentHub: Hub = context.hub 
        const type: ContentType = await currentHub.related.contentTypes.get(args[0])
        console.log(JSON.stringify(type,null,4))
        result = type
    }
}

/**
 * Get all repositories
 */
const getRepositories: Command = async () => {
    if (context.hub) {
        const currentHub: Hub = context.hub 
        const repos: ContentRepository[] = await paginator(currentHub.related.contentRepositories.list)
        const reposFilter = repos.filter((item: ContentRepository) => item.status == Status.ACTIVE)
        reposFilter
            .forEach((item: ContentRepository) => {
                console.log(`${FgRed}${item.label}${Reset} : ${FgRed}${item.name}${Reset} : ${Dim}${item.id}${Reset}`)
            })
        results = reposFilter
    }
}

/**
 * Get a repository by id, name or beginning of a name
 * 
 * @param args
 */
const getRepository: Command = async (args: string[]) => {
    if (args.length == 0) {
        delete context.repo
        delete context.folder
    } else if (context.hub) {
        const currentHub: Hub = context.hub 
        const repos: ContentRepository[] = await paginator(currentHub.related.contentRepositories.list)
        let filterRepos: ContentRepository[] = repos.filter((repo: ContentRepository) => repo.id == args[0])
        if (filterRepos.length == 0) {
            filterRepos = repos.filter((repo: ContentRepository) => repo.name == args[0])
            if (filterRepos.length == 0) {
                filterRepos = repos.filter((repo: ContentRepository) => repo.name?.startsWith(args[0])) 
            }
        }
        if (filterRepos.length>0) {
            const repo: ContentRepository = filterRepos[0]
            context.repo = repo
            result = repo
            delete context.folder
            console.log(`${FgRed}${repo.label}${Reset} : ${FgRed}${repo.name}${Reset} : ${Dim}${repo.id}${Reset}`)
        }
    }
}

/**
 * Get folders in a repo or current folder
 */
const getFolders: Command = async () => {
    if (context.repo) {
        let folders: Folder[]
        if (context.folder) {
            const currentFolder: Folder = context.folder
            folders =  await paginator(currentFolder.related.folders.list)
        } else {
            const currentRepo: ContentRepository = context.repo
            folders = await paginator(currentRepo.related.folders.list)
        }
        folders
            .forEach((item: Folder) => {
                console.log(`${FgYellow}${item.name}${Reset} : ${Dim}${item.id}${Reset}`)
            })
        results = folders
    }
}

/**
 * Get folder in a repo or folder, or go up to the parent folder
 * 
 * @param args folder name, empty or '..'
 */
const getFolder: Command = async (args: string[]) => {
    if (context.repo) {
        let folders: Folder[]
        if (context.folder) {
            const currentFolder: Folder = context.folder
            folders =  await paginator(currentFolder.related.folders.list)
        } else {
            const currentRepo: ContentRepository = context.repo
            folders = await paginator(currentRepo.related.folders.list)
        }
        if (args.length == 0) {
            delete context.folder
        } else if (args.length>0 && args[0] == '..') {
            const currentFolder: Folder = context.folder
            let parentFolder: Folder 
            try {
                parentFolder = await currentFolder.related.folders.parent()
                context.folder = parentFolder
                result = parentFolder
            } catch (error :any) {
                delete context.folder
            }
        } else if (args.length>0) {
            let filterFolders: Folder[] = folders.filter((folder: Folder) => folder.id == args[0])
            if (filterFolders.length == 0) {
                filterFolders = folders.filter((folder: Folder) => folder.name == args[0])
                if (filterFolders.length == 0) {
                    filterFolders = folders.filter((folder: Folder) => folder.name?.startsWith(args[0]))
                }
            }
            if (filterFolders.length>0) {
                const newFolder: Folder = filterFolders[0]
                context.folder = newFolder
                result = newFolder
                console.log(`${FgYellow}${newFolder.name}${Reset} : ${Dim}${newFolder.id}${Reset}`)
            }
        }
    }
}

/**
 * Get content items in repo or current folder
 */
const getItems: Command = async () => {
    if (context.folder) {
        const currentFolder: Folder = context.folder
        const items = await paginator(currentFolder.related.contentItems.list)
        const itemsFilter = items.filter((item: ContentItem) => item.status == Status.ACTIVE)
        itemsFilter
            .forEach((item: ContentItem) => { console.log(`${FgMagenta}${item.label}${Reset} : ${item.status} : ${Dim}${item.id}${Reset}${item.body._meta?.deliveryKey ? ' : ' + item.body._meta?.deliveryKey : ''}`) })
        results = itemsFilter
    } else {
        if (context.repo) {
            const currentRepo: ContentRepository = context.repo
            const items: ContentItem[] = await paginator(currentRepo.related.contentItems.list) 
            const itemsFilter = items.filter((item: ContentItem) => item.status == Status.ACTIVE)
            itemsFilter
                .forEach((item: ContentItem) => { console.log(`${FgMagenta}${item.label}${Reset} : ${Dim}${item.id}${Reset}${item.body._meta?.deliveryKey ? ' : ' + item.body._meta?.deliveryKey : ''}`) })
            results = itemsFilter
        }
    }
}

/**
 * Get folders and items in the current repo or folder
 * @param args 
 */
const listContent: Command = async () => {
    await getFolders([])
    await getItems([])
}

/**
 * Get a content item by id
 * 
 * @param args contentId
 */
const getItemById: Command = async (args: string[]) => {
    if (client && args.length>0) {
        const item: ContentItem = await client.contentItems.get(args[0])
        result = item
        const itemAny: any = item
        delete itemAny._links
        delete itemAny.related
        delete itemAny.client
        console.log(JSON.stringify(itemAny,null,4))
    }
}

/**
 * Get all extensions
 */
const getExtensions: Command = async() => {
    if (context.hub) {
        const currentHub: Hub = context.hub
        const extensions = await paginator(currentHub.related.extensions.list)
        extensions.forEach((extension: Extension) => {
            console.log(`${FgCyan}${extension.label}${Reset} : ${FgCyan}${extension.name}${Reset} : ${extension.category} : ${Dim}${extension.id}${Reset}`)
        })
        results = extensions
    }
}

/**
 * Get an extension by name
 * 
 * @param args extension name
 */
const getExtension: Command = async(args: string[]) => {
    if (context.hub && args.length>0) {
        const currentHub: Hub = context.hub
        let extension: Extension
        extension = await currentHub.related.extensions.getByName(args[0])
        const extensionAsAny: any = extension
        delete extensionAsAny._links
        delete extensionAsAny.related
        delete extensionAsAny.client
        console.log(JSON.stringify(extensionAsAny,null,4))
        result = extension
    }
}

/**
 * Get all webhooks
 */
const getWebhooks: Command = async() => {
    if (context.hub) {
        const currentHub: Hub = context.hub
        const webhooks: Webhook[] = await paginator(currentHub.related.webhooks.list)
        webhooks.forEach((webhook: Webhook) => {
            console.log(`${FgCyan}${webhook.label}${Reset} : ${FgCyan}${webhook.active}${Reset} : ${Dim}${webhook.id}${Reset}`)
        })
        results = webhooks
    }
}

/**
 * Get a webhook by id
 * 
 * @param args webhook id
 */
const getWebhook: Command = async(args: string[]) => {
    if (context.hub && args.length>0) {
        const currentHub: Hub = context.hub
        const webhook = await currentHub.related.webhooks.get(args[0])
        const webhookAsAny: any = webhook
        delete webhookAsAny._links
        delete webhookAsAny.related
        delete webhookAsAny.client
        console.log(JSON.stringify(webhookAsAny,null,4))
        result = webhook
    }
}

/**
 * Switch environment
 * 
 * @param args env name
 */
 const getEnv: Command = async (args: string[]) => {
    if (args.length>0) {
        dotenv.config({ path: `./.env.${args[0]}`, override: true})
        if (process.env.CLIENT_ID && process.env.CLIENT_SECRET) {
            context = {
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                hubId: process.env.HUB_ID,
                repoId: process.env.REPO_ID,
                variables: {}
            }
            await(connect([context.clientId,context.clientSecret,context.hubId]))
            if (context.repoId) { 
                await getRepository([context.repoId])
            }
        }
    }
}

/**
 * Exit command
 */
const exit: Command = async () => {
    quit = true
}

// all commands mapping and aliases
const commandsMapping: any = {
    'conn': connect,
    'connect': connect,
    'context': showContext,
    'client': showClient,
    'eval': evalExpression,
    'hubs': listHubs,
    'hub': getHub,
    'settings': getHubSettings,
    'schemas': getSchemas,
    'schema': getSchema,
    'types': getTypes,
    'type': getType,
    'repos': getRepositories,
    'repo': getRepository,
    'folders': getFolders,
    'ls': listContent,
    'cd': getFolder,
    'folder': getFolder,
    'items': getItems,
    'item': getItemById,
    'cat': getItemById,
    'extensions': getExtensions,
    'extension': getExtension,
    'webhooks': getWebhooks,
    'webhook': getWebhook,
    'exit': exit,
    'quit': exit,
    'bye': exit,
    'env': getEnv,
    'setvar': setVariable,
    'set': setVariable,
    'var': setVariable,
    'vars': showVariables,
    'variables': showVariables,
    'echo': echo,
    'print': echo
}

// main console loop
const runConsole = async () => {
    console.log(`Dynamic Content Console v${pjson.version}`)

    // connect to Amplience Dynamic Content instance
    await(connect([context.clientId,context.clientSecret,context.hubId]))
    if (context.repoId) { 
        await getRepository([context.repoId])
    }
    while (!quit) {

        // building prompt
        let promptString = ''
        if (context.hub) {
            promptString += FgGreen + context.hub.name + Reset
        }
        if (context.repo) {
            promptString += ' > ' + FgRed + context.repo.name + Reset
        }

        // traversing all folder parents
        let folderPrompt = ''
        if (context.folder) {
            const currentFolder = context.folder
            folderPrompt = ' > ' + FgYellow + currentFolder.name + Reset
            try {
                let parentFolder: Folder = await currentFolder.related.folders.parent()
                while (parentFolder) {
                    folderPrompt = ' > ' + FgYellow + parentFolder.name + Reset + folderPrompt
                    parentFolder = await parentFolder.related.folders.parent()
                }
            } catch(error: any) {}
        }
        promptString += folderPrompt
        const input: string = prompt(promptString + ' > ')
            .replace(/\s+(?=(?:(?:[^`]*`){2})*[^`]*`[^`]*$)/g, "\\s") // replace all spaces within ``
            .replace(/\s+(?=(?:(?:[^"]*"){2})*[^"]*"[^"]*$)/g, "\\s") // replace all spaces within ""
            .replace(/\\ /g, "\\s")                                   // replace all "\ "

        // getting tokens and executing command
        const tokens: string[] = prepareTokens(input.split(' '))
        if (tokens.length > 0) {
            const userCommand = tokens[0]
            const command: any = commandsMapping[userCommand]
            if (command) {
                try {
                    await command(tokens.slice(1))
                } catch(error: any) {
                    console.error(error.message)
                }
            }
        }
    }
}
runConsole()