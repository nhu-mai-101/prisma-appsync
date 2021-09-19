import { inspect as nodeInspect } from 'util'

const errorCodes = {
    'FORBIDDEN': 401,
    'BAD_USER_INPUT': 400,
    'INTERNAL_SERVER_ERROR': 500,
}

type ErrorExtensions = {
    type: keyof typeof errorCodes,
    trace?: string[]
    [key:string]: any
}

type ErrorDetails = {
    error: string
    type: ErrorExtensions['type']
    code: number
    trace: ErrorExtensions['trace']
}

export class CustomError extends Error {
    public error: ErrorDetails['error']
    public type: ErrorDetails['type']
    public code: ErrorDetails['code']
    public trace: ErrorDetails['trace']
    public details: ErrorDetails

    constructor(message: string, extensions: ErrorExtensions) {
        super(message)

        this.error = message
        this.type = extensions.type
        this.trace = extensions?.trace || []
        this.code = typeof errorCodes[this.type] !== 'undefined'
            ? errorCodes[this.type] : errorCodes['INTERNAL_SERVER_ERROR']

        if (this.stack && this.stack.length > 0) this.trace.unshift(this.stack)

        this.message = JSON.stringify({
            error: this.error,
            type: this.type,
            code: this.code,
        })

        this.details = {
            error: this.error,
            type: this.type,
            code: this.code,
            trace: this.trace,
        }

        log([this.details], 'ERROR')
    }
}

export function parseError(error:Error):CustomError {
    if (error instanceof CustomError) {
        return error
    } else {
        return new CustomError(error.message, {
            type: 'INTERNAL_SERVER_ERROR',
            trace: [error?.stack]
        })
    }
}

export function inspect(data:any):string {
    return nodeInspect(data, { compact: true, depth: 5, breakLength: 80, colors: true })
}

export function debug(...data):void {
    if (process.env.PRISMA_APPSYNC_DEBUG === 'true') {
        log([...data])
    }
}

export function log(data: any, level?: 'ERROR' | 'WARN' | 'INFO'):void {
    const logLevel = typeof level !== 'undefined' ? level : 'INFO'
    const logPrefix = `◭ Prisma-AppSync :: <<${logLevel}>>`
    const dataList = Array.isArray(data) ? data : []

    dataList.forEach((d:any) => {
        const logMessage = typeof d === 'string' ? d : inspect(d)

        if (level === 'ERROR') {
            console.error(`${logPrefix} ${logMessage}`)
        } else if (level === 'WARN') {
            console.warn(`${logPrefix} ${logMessage}`)
        } else {
            console.info(`${logPrefix} ${logMessage}`)
        }
    })
}
