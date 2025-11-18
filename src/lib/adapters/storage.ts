/**
 * Storage Adapter Interface
 *
 * Abstract file storage to support multiple providers:
 * - Local filesystem
 * - AWS S3
 * - Google Cloud Storage
 * - Azure Blob Storage
 * - Cloudflare R2
 */

export interface StorageObject {
  key: string
  url: string
  size: number
  contentType?: string
  metadata?: Record<string, string>
}

export interface UploadOptions {
  key: string
  data: Buffer | string
  contentType?: string
  metadata?: Record<string, string>
  public?: boolean
}

export interface IStorageAdapter {
  upload(options: UploadOptions): Promise<StorageObject>
  download(key: string): Promise<Buffer>
  delete(key: string): Promise<void>
  getUrl(key: string, expiresIn?: number): Promise<string>
  exists(key: string): Promise<boolean>
  list(prefix?: string): Promise<StorageObject[]>
}

/**
 * Stub Storage Adapter (in-memory, for development)
 */
export class StubStorageAdapter implements IStorageAdapter {
  private storage: Map<string, { data: Buffer; metadata: UploadOptions }> = new Map()

  async upload(options: UploadOptions): Promise<StorageObject> {
    const data = typeof options.data === 'string'
      ? Buffer.from(options.data)
      : options.data

    this.storage.set(options.key, { data, metadata: options })

    return {
      key: options.key,
      url: `/storage/${options.key}`,
      size: data.length,
      contentType: options.contentType,
      metadata: options.metadata,
    }
  }

  async download(key: string): Promise<Buffer> {
    const obj = this.storage.get(key)
    if (!obj) {
      throw new Error(`Object not found: ${key}`)
    }
    return obj.data
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key)
  }

  async getUrl(key: string, expiresIn?: number): Promise<string> {
    if (!this.storage.has(key)) {
      throw new Error(`Object not found: ${key}`)
    }
    return `/storage/${key}`
  }

  async exists(key: string): Promise<boolean> {
    return this.storage.has(key)
  }

  async list(prefix?: string): Promise<StorageObject[]> {
    const objects: StorageObject[] = []

    for (const [key, { data, metadata }] of this.storage.entries()) {
      if (!prefix || key.startsWith(prefix)) {
        objects.push({
          key,
          url: `/storage/${key}`,
          size: data.length,
          contentType: metadata.contentType,
          metadata: metadata.metadata,
        })
      }
    }

    return objects
  }
}

// Default adapter
let storageAdapter: IStorageAdapter = new StubStorageAdapter()

export function setStorageAdapter(adapter: IStorageAdapter): void {
  storageAdapter = adapter
}

export function getStorageAdapter(): IStorageAdapter {
  return storageAdapter
}
