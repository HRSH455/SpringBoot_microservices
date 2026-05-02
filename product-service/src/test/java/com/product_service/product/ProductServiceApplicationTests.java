package com.product_service.product;

import io.restassured.RestAssured;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.testcontainers.containers.MongoDBContainer;

import static io.restassured.RestAssured.*;

@Import(TestcontainersConfiguration.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class ProductServiceApplicationTests {

    @ServiceConnection //springboot automatically adds this mongodb uri to the apprlication properties file
    static MongoDBContainer mongoDBContainer = new MongoDBContainer("mongo:7.0.5");

    @LocalServerPort //fetches the random port being used
    private Integer port; //holds the port to be used
    @BeforeEach //runs with each "run" during compile
    //inits the port to be tested for integration
    void setup(){
        RestAssured.baseURI = "http://localhost";
        RestAssured.port = port;
    }

    static{
        mongoDBContainer.start();
    }

    @Test
	void shouldCreateProduct() {
        //multi-line string of the requestbody to be checked
        String requestBody = """
                {
                "name" : "iPhone 15",
                "description" : "iPhone 15 is a smartphone from Apple.",
                "price" : 1000
                }
                """;

        RestAssured.given()
                .contentType("application/json")
                .body(requestBody)
                .when()
                .post("/api/product")
                .then()
                .statusCode(201)
                .body("id" , Matchers.notNullValue())
                .body("price" , Matchers.equalTo(1000));

	}


}
