import { DynamicContent, Folder, Hub, ContentItem, Extension, FacetQuery, Status, ContentRepository, ContentTypeSchema, ContentType, HalResource, Page, Pageable, Settings, Sortable, Webhook } from 'dc-management-sdk-js'
var pjson = require('./package.json');
const prompt = require('prompt-sync')({ sigint: true })
let client: DynamicContent

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

interface Command {
    (args: any[]): Promise<void>
}

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

let result: any
let results: any[]

const context: any = {
    clientId: '27b98f7f-1386-4249-b612-0d09301ef0a2',
    clientSecret: '0cad2823c9407f584fe582ce606dece6f90a41549f4cb23f6b9c21f85d1d3aaa',
    hubId: '5ff628fdc9e77c0001da3f7c',
    repoId: '5ff629064cedfd00013c2600'
}

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

const showClient: Command = async () => {
    console.log(client)
}

const showContext: Command = async () => {
    console.log(context)
}

const evalExpression: Command = async (args: string[]) => {
    const expression = args.join(' ')
    const evalResult = eval(expression)
    console.log(evalResult)
}

const listHubs: Command = async () => {
    const hubs: Hub[] = await paginator(client.hubs.list)
    hubs.forEach((hub: Hub) => {
        console.log(`${FgGreen}${hub.label}${Reset} : ${FgGreen}${hub.name}${Reset} : ${Dim}${hub.id}${Reset}`)
    })
    results = hubs
}

const getHub: Command = async (args: string[]) => {
    if (args.length == 0) return
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

const getHubSettings: Command = async () => {
    if (context.hub) {
        const settings = context.hub.settings
        result = settings
        context.settings = settings
        console.log(`vse: ${settings.virtualStagingEnvironment.hostname}`)
    }
}

const getSchemas: Command = async () => {
    if (context.hub) {
        const currentHub: Hub = context.hub 
        const schemas: ContentTypeSchema[] = await paginator(currentHub.related.contentTypeSchema.list)
        schemas
            .filter((item: ContentTypeSchema) => item.status == Status.ACTIVE)
            .forEach((item: ContentTypeSchema) => { console.log(`${FgCyan}${item.schemaId}${Reset}`) })
        results = schemas
    }
}

const getSchema: Command = async (args: string[]) => {
    if (context.hub) {
        const currentHub: Hub = context.hub 
        const schemas: ContentTypeSchema[] = await paginator(currentHub.related.contentTypeSchema.list)
        const filterSchemas: ContentTypeSchema[] = schemas.filter((item: ContentTypeSchema) => item.schemaId == args[0])
        if (filterSchemas.length>0) {
            const schema = filterSchemas[0]
            result = schema
            const itemAny: any = schema
            delete itemAny._links
            delete itemAny.related
            delete itemAny.client
            console.log(itemAny)
        }
    }
}

const getTypes: Command = async () => {
    if (context.hub) {
        const currentHub: Hub = context.hub 
        const types: ContentType[] = await paginator(currentHub.related.contentTypes.list)
        types
            .filter((item: ContentType) => item.status == Status.ACTIVE)
            .forEach((item: ContentType) => { console.log(`${FgBlue}${item.settings?.label}${Reset} : ${FgCyan}${item.contentTypeUri}${Reset}`) })
        results = types
    }
}

const getRepositories: Command = async () => {
    if (context.hub) {
        const currentHub: Hub = context.hub 
        const repos: ContentRepository[] = await paginator(currentHub.related.contentRepositories.list)
        repos
            .filter((item: ContentRepository) => item.status == Status.ACTIVE)
            .forEach((item: ContentRepository) => {
            console.log(`${FgRed}${item.label}${Reset} : ${FgRed}${item.name}${Reset} : ${Dim}${item.id}${Reset}`)
        })
        results = repos
    }
}

const getRepository: Command = async (args: string[]) => {
    if (args.length == 0) {
        delete context.repo
        delete context.folder
        return
    }
    if (context.hub) {
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

const getItems: Command = async (args: string[]) => {
    if (context.folder) {
        const currentFolder: Folder = context.folder
        const items = await paginator(currentFolder.related.contentItems.list)
        items
            .filter((item: ContentItem) => item.status == Status.ACTIVE)
            .forEach((item: ContentItem) => { console.log(`${FgMagenta}${item.label}${Reset} : <${item.body._meta?.deliveryKey}> : ${Dim}${item.id}${Reset}${item.body._meta?.deliveryKey ? ' : ' + item.body._meta?.deliveryKey : ''}`) })
        results = items
    } else {
        if (context.repo) {
            const currentRepo: ContentRepository = context.repo
            const items: ContentItem[] = await paginator(currentRepo.related.contentItems.list) 
            items
                .filter((item: ContentItem) => item.status == Status.ACTIVE)
                .forEach((item: ContentItem) => { console.log(`${FgMagenta}${item.label}${Reset} : ${Dim}${item.id}${Reset}${item.body._meta?.deliveryKey ? ' : ' + item.body._meta?.deliveryKey : ''}`) })
            results = items
        }
    }
}

const listContent: Command = async (args: string[]) => {
    await getFolders([])
    await getItems([])
}

const getItemById: Command = async (args: string[]) => {
    if (client && args.length>0) {
        const item: ContentItem = await client.contentItems.get(args[0])
        result = item
        const itemAny: any = item
        delete itemAny._links
        delete itemAny.related
        delete itemAny.client
        console.log(itemAny)
    }
}

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

const getExtension: Command = async(args: string[]) => {
    if (context.hub && args.length>0) {
        const currentHub: Hub = context.hub
        let extension: Extension
        extension = await currentHub.related.extensions.getByName(args[0])
        const extensionAsAny: any = extension
        delete extensionAsAny._links
        delete extensionAsAny.related
        delete extensionAsAny.client
        console.log(extensionAsAny)
        result = extension
    }
}

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

const getWebhook: Command = async(args: string[]) => {
    if (context.hub && args.length>0) {
        const currentHub: Hub = context.hub
        const webhook = await currentHub.related.webhooks.get(args[0])
        const webhookAsAny: any = webhook
        delete webhookAsAny._links
        delete webhookAsAny.related
        delete webhookAsAny.client
        console.log(webhookAsAny)
        result = webhook
    }
}

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
    'webhook': getWebhook
}

const runConsole = async () => {
    console.log(`Dynamic Content Console v${pjson.version}`)
    await(connect([context.clientId,context.clientSecret,context.hubId]))
    if (context.repoId) { 
        await getRepository([context.repoId])
    }
    let quit = false
    while (!quit) {
        let promptString = ''
        if (context.hub) {
            promptString += FgGreen + context.hub.name + Reset
        }
        if (context.repo) {
            promptString += ' > ' + FgRed + context.repo.name + Reset
        }
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
        const tokens: string[] = input.split(' ')
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
        if (input === 'exit' || input === 'quit') {
            quit = true
        }
    }
}
runConsole()