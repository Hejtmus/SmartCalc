<script>
    import {location} from 'svelte-spa-router';
    import {
        Container,
        Row,
        Col,
        Nav,
        NavItem,
        NavLink,
        Button
    } from 'sveltestrap';

    const menu = [
        {to: "#/math/Smart", text: 'Smart mode'},
        {to: "#/math/FNC", text: 'Functions'},
        {to: "#/math/PM", text: '+ -'},
        {to: "#/math/TD", text: '* /'},
        {to: "#/math/PR", text: 'Power & root'},
    ];

    import Router from 'svelte-spa-router';
    import Main from './modes/Main.svelte';
    import SmartMode from './modes/Smart.svelte';
    import FunctionMode from './modes/Functions.svelte'
    import PlusMinus from './modes/PlusMinus.svelte';
    import TimesDivide from './modes/TimesDivide.svelte';
    import PowerRoot from './modes/PowerRoot.svelte';
    import Unselectable from "../../components/Unselectable.svelte";

    const prefix = '/math';
    const routes = {
        '/Smart': SmartMode,
        '/FNC': FunctionMode,
        '/PM': PlusMinus,
        '/TD': TimesDivide,
        '/PR': PowerRoot,
        '/*': Main,
    };
</script>

<Container fluid class="h-100">
    <Row class="h-100">
        <Unselectable>
            <Col xs="auto" md="auto" class="h-100 bg-light d-flex flex-column shadow-lg">
                <Nav vertical class="text-secondary m-1">
                    <NavItem>
                        <h2>
                            <a class="text-secondary text-decoration-none" href="#/Math">
                                Math
                            </a>
                        </h2>
                    </NavItem>
                    {#each menu as item}
                        <NavItem>
                            <NavLink class="btn-outline-dark m-1" href="{item.to}">
                                {item.text}
                            </NavLink>
                        </NavItem>
                    {/each}
                </Nav>
                <Button outline color="dark" href="#/" class="m-1 mt-auto">
                    Back
                </Button>
            </Col>
        </Unselectable>
        <Col xs="auto">
            <section class="w-auto">
                <Router {prefix} {routes}/>
            </section>
        </Col>
    </Row>

</Container>
