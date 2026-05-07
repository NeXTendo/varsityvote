'use client'

import { useState } from 'react'
import { createInstitution } from '@/lib/institutions'

export function InstitutionForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    
    const result = await createInstitution(formData)
    
    if (result.error) {
      setError(result.error)
    } else {
      // Reset form if successful (native way)
      const form = document.getElementById('institution-form') as HTMLFormElement
      form?.reset()
    }
    setLoading(false)
  }

  return (
    <form id="institution-form" action={handleSubmit} className="space-y-4 p-6 bg-card rounded-xl border border-border">
      <h2 className="text-lg font-semibold">Add New Institution</h2>
      
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">Institution Name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="University of Zambia"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="slug" className="text-sm font-medium">Slug (unique)</label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            placeholder="unza"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="domain" className="text-sm font-medium">Email Domain</label>
          <input
            id="domain"
            name="domain"
            type="text"
            placeholder="unza.zm"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Institution'}
      </button>
    </form>
  )
}
