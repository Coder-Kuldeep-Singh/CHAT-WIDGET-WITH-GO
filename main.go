package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"

	pusher "github.com/pusher/pusher-http-go"
)

// Here, we register the Pusher client
var client = pusher.Client{
	AppID:   "PUSHER_APP_ID",
	Key:     "PUSHER_APP_KEY",
	Secret:  "PUSHER_APP_SECRET",
	Cluster: "PUSHER_APP_CLUSTER",
	Secure:  true,
}

type Customer struct {
	Name  string `json:"name" xml:"name" form:"name" query:"name"`
	Email string `json:"email" xml:"email" form:"email" query:"email"`
}

func broadcastCustomerDetails(rw http.ResponseWriter, req *http.Request) {
	body, err := ioutil.ReadAll(req.Body)
	if err != nil {
		panic(err)
	}
	var newCustomer Customer
	err = json.Unmarshal(body, &newCustomer)
	if err != nil {
		panic(err)
	}
	client.Trigger("one-to-many", "new-cutomer", newCustomer)
	json.NewEncoder(rw).Encode(newCustomer)
}

func pusherAuth(res http.ResponseWriter, req *http.Request) {
	params, _ := ioutil.ReadAll(req.Body)
	response, err := client.AuthenticatePrivateChannel(params)
	if err != nil {
		panic(err)
	}
	fmt.Fprintf(res, string(response))
}

func main() {
	http.Handle("/", http.FileServer(http.Dir("./public")))

	http.HandleFunc("/new/customer", broadcastCustomerDetails)
	http.HandleFunc("/pusher/auth", pusherAuth)

	log.Fatal(http.ListenAndServe(":8070", nil))
}
