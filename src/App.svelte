<script>
    import Router from 'svelte-spa-router';
    import Menu from './routes/Menu.svelte';
    import Settings from './routes/Settings.svelte';
    import News from './routes/News/News.svelte';
    import Math from './routes/Math/Math.svelte';
    import Electro from './routes/Electro/Electro.svelte';
    import Physics from './routes/Physics/Physics.svelte';

    const routes = {
        '/': Menu,
        '/news': News,
        '/settings':Settings,
        '/math': Math,
        '/math/*': Math,
        '/electro': Electro,
        '/electro/*': Electro,
        '/physics': Physics,
        '/physics/*': Physics,
    }
</script>

<Router {routes} />