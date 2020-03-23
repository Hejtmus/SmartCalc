<script>
    import {
        Container,
        Row,
        Col,
        Button
    } from 'sveltestrap';
    import Unselectable from "../components/Unselectable.svelte";
</script>

<Unselectable>
    <Container fluid class="text-center h-100">
        <Row class="p-5">
            <Col>
                <h2>Settings</h2>
                <h6>Tool that solves questionable science problems</h6>
            </Col>
        </Row>
        <Row class="justify-content-center p-4">
            <Col xs="8">
            </Col>
        </Row>
        <Row class="fixed-bottom p-3">
            <Col class="d-inline-flex justify-content-between align-items-start">
                <Button outline color="dark" class="align-self-start order-1" href="#/">Back</Button>
            </Col>
        </Row>
    </Container>
</Unselectable>
