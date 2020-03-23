<script>
    import {
        Container,
            Row,
            Col,
            Button
    } from 'sveltestrap';
</script>

<Container fluid class="text-center h-100">
    <Row class="p-5">
        <Col>
            <h2>SmartCalc 0.3.0</h2>
            <h6>News</h6>
        </Col>
    </Row>
    <Row class="justify-content-center p-4">
        <Col xs="8">
            <Row>
                <Col>
                    Github repo
                </Col>
            </Row>
        </Col>
    </Row>
    <Row class="fixed-bottom p-3">
        <Col class="d-inline-flex justify-content-between align-items-start">
            <Button outline color="dark" class="align-self-start order-1" href="#/">Back</Button>
        </Col>
    </Row>
</Container>
