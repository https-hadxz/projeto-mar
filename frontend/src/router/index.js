import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', name: 'inicio', component: () => import('../views/Inicio.vue') },
    { path: '/explorar', name: 'explorar', component: () => import('../views/Explorar.vue') },
    { path: '/artigo/:id', name: 'artigo', component: () => import('../views/Artigo.vue') },
    {
      path: '/novo',
      name: 'novo',
      component: () => import('../views/EditorArtigo.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/editar/:id',
      name: 'editar',
      component: () => import('../views/EditorArtigo.vue'),
      meta: { requiresAuth: true }
    },
    { path: '/login', name: 'login', component: () => import('../views/Login.vue') },
    { path: '/cadastro', name: 'cadastro', component: () => import('../views/Cadastro.vue') },
    {
      path: '/perfil',
      name: 'perfil',
      component: () => import('../views/Perfil.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !auth.token) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})

export default router