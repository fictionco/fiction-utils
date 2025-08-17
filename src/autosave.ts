import { ref } from 'vue'

export type AutosaveConfig<T = unknown> = {
  onSave?: () => Promise<T | undefined | void>
  onTrigger?: () => void
  debounceMs?: number
  onError?: (error: unknown) => void
}

export class AutosaveUtility<T = unknown> {
  isDirty = ref(false)
  private saveTimeout: ReturnType<typeof setTimeout> | null = null

  constructor(private config: AutosaveConfig<T>) {}

  public autosave(_args: { caller: string }): void {
    this.isDirty.value = true
    this.config.onTrigger?.()
    this.debouncedSave()
  }

  public async forceSync(): Promise<T | undefined | void> {
    this.clear()
    return this.save()
  }

  public clear(): void {
    this.clearTimeout()
    this.isDirty.value = false
  }

  private debouncedSave(): void {
    this.clearTimeout()
    this.saveTimeout = setTimeout(async () => this.save(), this.config.debounceMs ?? 2000)
  }

  private async save(): Promise<T | undefined | void> {
    if (!this.config.onSave) {
      return
    }

    try {
      const r = await this.config.onSave()
      this.isDirty.value = false

      return r
    } catch (error) {
      if (this.config.onError) {
        this.config.onError(error)
      }

      console.warn('Autosave error:', error)
    }
  }

  clearTimeout(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout)
      this.saveTimeout = null
    }
  }
}
