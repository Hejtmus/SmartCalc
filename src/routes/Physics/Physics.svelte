<script>
    import {
        Container,
        Row,
        Col,
        Button
    } from 'sveltestrap';
    import Unselectable from "../../components/Unselectable.svelte";
</script>

<Container fluid class="text-center h-100">
    <Row class="h-100">
        <Col class="h-100 d-flex flex-column justify-content-center">
            <div class="pb-5">
                <Unselectable>
                    <h1>
                        Work In Progress
                    </h1>
                    <h2 class="mb-5">
                        Coming soon
                    </h2>
                </Unselectable>
            </div>
        </Col>
    </Row>
    <Row class="fixed-bottom p-3">
        <Col class="d-inline-flex justify-content-between align-items-start">
            <Unselectable>
                <Button outline color="dark" class="align-self-start order-1" href="#/">Back</Button>
            </Unselectable>
        </Col>
    </Row>
</Container>