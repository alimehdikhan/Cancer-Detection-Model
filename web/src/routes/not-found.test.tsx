import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { SiteFooter } from '@/components/layout/site-footer'

import NotFoundRoute from './not-found'

function renderAt(path: string, element: React.ReactNode) {
  const router = createMemoryRouter([{ path: '*', element }], { initialEntries: [path] })
  return render(<RouterProvider router={router} />)
}

describe('not-found page', () => {
  it('names the missing path, sets the tab title and links back', () => {
    renderAt('/no/such/page', <NotFoundRoute />)
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy()
    expect(screen.getByText('/no/such/page')).toBeTruthy()
    expect(document.title).toBe('Page not found · Dermsight')
    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(hrefs).toEqual(expect.arrayContaining(['/', '/model', '/conditions', '/about']))
  })
})

describe('site footer', () => {
  it('deep-links the Learn column into /about', () => {
    renderAt('/', <SiteFooter />)
    const href = (name: string) => screen.getByRole('link', { name }).getAttribute('href')
    expect(href('How it works')).toBe('/about#pipeline')
    expect(href('Privacy')).toBe('/about#privacy')
    expect(href('Limitations')).toBe('/about#limitations')
    expect(screen.getAllByText(/Not a medical device/).length).toBeGreaterThan(0)
  })
})
