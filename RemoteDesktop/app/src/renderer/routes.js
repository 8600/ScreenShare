export default [
  {
    path: '/',
    name: 'landing-page',
    component: require('components/index')
  },
  {
    path: '/select',
    name: 'slect-page',
    component: require('components/select')
  },
  {
    path: '*',
    redirect: '/'
  }
]
