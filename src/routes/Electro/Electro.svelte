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
        {to: "#/electro/OHML", text: "Ohm's law"},
        {to: "#/electro/CMPT", text: 'Electro components'},
        {to: "#/electro/MGNF", text: 'Magnetic field'},
        {to: "#/electro/INDL", text: 'Induction law'},
        {to: "#/electro/AC", text: 'AC'},
        {to: "#/electro/RLCC", text: 'RLC circuits'},
    ];

    import Router from 'svelte-spa-router';
    import Main from './modes/Main.svelte';
    import OHML from './modes/OhmsLaw.svelte';
    import CMPT from './modes/Components.svelte'
    import MGNF from './modes/MagneticField.svelte';
    import INDL from './modes/InductionLaw.svelte';
    import AC from './modes/AC.svelte';
    import RLCC from './modes/RLC.svelte';
    import Unselectable from "../../components/Unselectable.svelte";

    const prefix = '/math';
    const routes = {
        '/OHML': OHML,
        '/CMPT': CMPT,
        '/MGNF': MGNF,
        '/INDL': INDL,
        '/RLCC': RLCC,
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
                                Electro
                            </a>
                        </h2>
                    </NavItem>
                    {#each menu as item}
                        {#if item.text === "Ohm's law"}
                            <NavItem>
                                <h5>
                                    Basic
                                </h5>
                            </NavItem>
                        {:else if item.text === 'Magnetic field'}
                            <NavItem>
                                <h5>
                                    DC
                                </h5>
                            </NavItem>
                        {:else if item.text === 'AC'}
                            <NavItem>
                                <h5>
                                    AC
                                </h5>
                            </NavItem>
                        {/if}
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
