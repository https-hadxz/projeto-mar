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

    { path: '/animais', name: 'animais', component: () => import('../views/Animais.vue') },
    {
      path: '/animais/novo',
      name: 'novo-animal',
      component: () => import('../views/EditorAnimal.vue'),
      meta: { requiresAuth: true }
    },
    { path: '/animais/:id', name: 'animal', component: () => import('../views/Animal.vue') },
    {
      path: '/animais/:id/editar',
      name: 'editar-animal',
      component: () => import('../views/EditorAnimal.vue'),
      meta: { requiresAuth: true }
    },

    { path: '/login', name: 'login', component: () => import('../views/Login.vue') },
    { path: '/cadastro', name: 'cadastro', component: () => import('../views/Cadastro.vue') },

    { path: '/u/:id', name: 'usuario', component: () => import('../views/Usuario.vue') },
    {
      path: '/perfil/editar',
      name: 'editar-perfil',
      component: () => import('../views/EditarPerfil.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/perfil',
      redirect: () => (auth.user ? `/u/${auth.user.id}` : '/login')
    },

    {
      path: '/moderacao',
      name: 'moderacao',
      component: () => import('../views/Moderacao.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    }
  ]
})

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !auth.token) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresAdmin && auth.user?.role !== 'admin') {
    return { name: 'inicio' }
  }
})

export default router