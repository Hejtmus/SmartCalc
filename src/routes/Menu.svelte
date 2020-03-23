<script>
    import {
        Container,
        Row,
        Col,
        Button,
        ListGroup,
        ListGroupItem
    } from 'sveltestrap';
    import {
        onMount
    } from 'svelte';
    import Unselectable from "../components/Unselectable.svelte";
    //import Flare from '@2dimensions/flare-js'

    let flutterLogoCanvas;
    let flutterLogo;
    onMount(() => {
        //console.log(Flare);
        /*
        flutterLogo = new Flare.Graphics(flutterLogoCanvas,()=>{
            window.requestAnimationFrame();
            Flare.ActorLoader.load("./assets/animations/SCLogo.flr", function (error) {
                if (error) {
                    console.log("failed to load actor file...", error);
                }
            });
            Flare.Actor.initialize();
        });

         */
        /*
        flutterLogo = new Flare.Graphics(flutterLogoCanvas,()=>{
            window.requestAnimationFrame();
        });
        let actor = new Flare.Actor();
        flutterLogo.load("./assets/animations/SCLogo.flr", function (error) {
            if (error) {
                console.log("failed to load actor file...", error);
            }
        });
        Flare.Actor.initialize();

         */

    });

</script>

<Unselectable>
    <Container fluid class="text-center h-100">
        <Row class="p-5">
            <Col>
                <canvas bind:this={flutterLogoCanvas}></canvas>
                <h1>SmartCalc</h1>
                <h6>Tool that solves questionable science problems</h6>
            </Col>
        </Row>
        <Row class="justify-content-center p-4">
            <Col xs="8">
                <ListGroup class="border rounded shadow-lg">
                    <ListGroupItem action href="#/Math"><span>Math</span></ListGroupItem>
                    <ListGroupItem action href="#/Electro"><span>Electrical engineering</span></ListGroupItem>
                    <ListGroupItem action href="#/Physics"><span>Physics</span></ListGroupItem>
                </ListGroup>
            </Col>
        </Row>
        <Row class="fixed-bottom p-3">
            <Col class="d-inline-flex justify-content-between align-items-start">
                <Button outline color="dark" class="align-self-start order-1" href="#/news">Changelog</Button>
                <Button outline color="dark" class="align-self-end order-2" href="#/settings"><i class="fa fa-gear"></i></Button>
            </Col>
        </Row>
    </Container>
</Unselectable>
