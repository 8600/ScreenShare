export default [
  {
    path: '/',
    name: 'landing-page',
    component: require('components/index')
  },
  {
    path: '*',
    redirect: '/'
  }
]
