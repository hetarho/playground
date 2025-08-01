/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

import { Route as rootRouteImport } from './__root'
import { Route as ThreeRouteImport } from './three'
import { Route as MetaballRouteImport } from './metaball'
import { Route as GiltBronzeIncenseBurnerRouteImport } from './gilt-bronze-incense-burner'
import { Route as CanvasRouteImport } from './canvas'
import { Route as AboutRouteImport } from './about'
import { Route as IndexRouteImport } from './index'

const ThreeRoute = ThreeRouteImport.update({
  id: '/three',
  path: '/three',
  getParentRoute: () => rootRouteImport,
} as any)
const MetaballRoute = MetaballRouteImport.update({
  id: '/metaball',
  path: '/metaball',
  getParentRoute: () => rootRouteImport,
} as any)
const GiltBronzeIncenseBurnerRoute = GiltBronzeIncenseBurnerRouteImport.update({
  id: '/gilt-bronze-incense-burner',
  path: '/gilt-bronze-incense-burner',
  getParentRoute: () => rootRouteImport,
} as any)
const CanvasRoute = CanvasRouteImport.update({
  id: '/canvas',
  path: '/canvas',
  getParentRoute: () => rootRouteImport,
} as any)
const AboutRoute = AboutRouteImport.update({
  id: '/about',
  path: '/about',
  getParentRoute: () => rootRouteImport,
} as any)
const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/about': typeof AboutRoute
  '/canvas': typeof CanvasRoute
  '/gilt-bronze-incense-burner': typeof GiltBronzeIncenseBurnerRoute
  '/metaball': typeof MetaballRoute
  '/three': typeof ThreeRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/about': typeof AboutRoute
  '/canvas': typeof CanvasRoute
  '/gilt-bronze-incense-burner': typeof GiltBronzeIncenseBurnerRoute
  '/metaball': typeof MetaballRoute
  '/three': typeof ThreeRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/about': typeof AboutRoute
  '/canvas': typeof CanvasRoute
  '/gilt-bronze-incense-burner': typeof GiltBronzeIncenseBurnerRoute
  '/metaball': typeof MetaballRoute
  '/three': typeof ThreeRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/about'
    | '/canvas'
    | '/gilt-bronze-incense-burner'
    | '/metaball'
    | '/three'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/about'
    | '/canvas'
    | '/gilt-bronze-incense-burner'
    | '/metaball'
    | '/three'
  id:
    | '__root__'
    | '/'
    | '/about'
    | '/canvas'
    | '/gilt-bronze-incense-burner'
    | '/metaball'
    | '/three'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  AboutRoute: typeof AboutRoute
  CanvasRoute: typeof CanvasRoute
  GiltBronzeIncenseBurnerRoute: typeof GiltBronzeIncenseBurnerRoute
  MetaballRoute: typeof MetaballRoute
  ThreeRoute: typeof ThreeRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/three': {
      id: '/three'
      path: '/three'
      fullPath: '/three'
      preLoaderRoute: typeof ThreeRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/metaball': {
      id: '/metaball'
      path: '/metaball'
      fullPath: '/metaball'
      preLoaderRoute: typeof MetaballRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/gilt-bronze-incense-burner': {
      id: '/gilt-bronze-incense-burner'
      path: '/gilt-bronze-incense-burner'
      fullPath: '/gilt-bronze-incense-burner'
      preLoaderRoute: typeof GiltBronzeIncenseBurnerRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/canvas': {
      id: '/canvas'
      path: '/canvas'
      fullPath: '/canvas'
      preLoaderRoute: typeof CanvasRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/about': {
      id: '/about'
      path: '/about'
      fullPath: '/about'
      preLoaderRoute: typeof AboutRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  AboutRoute: AboutRoute,
  CanvasRoute: CanvasRoute,
  GiltBronzeIncenseBurnerRoute: GiltBronzeIncenseBurnerRoute,
  MetaballRoute: MetaballRoute,
  ThreeRoute: ThreeRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()
