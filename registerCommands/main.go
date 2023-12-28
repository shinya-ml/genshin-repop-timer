package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

type Command struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func main() {
	if err := godotenv.Load("../.dev.vars"); err != nil {
		log.Fatalf("failed to load env vars: %v", err)
	}
	applicationID := os.Getenv("APPLICATION_ID")

	testCommand := []Command{
		{
			Name:        "test",
			Description: "test command",
		},
	}
	body, err := json.Marshal(testCommand)
	if err != nil {
		log.Fatalf("failed to marshal command: %v", err)
	}

	req, err := http.NewRequest(http.MethodPut, fmt.Sprintf("https://discord.com/api/v10/applications/%s/commands", applicationID), bytes.NewBuffer(body))
	if err != nil {
		log.Fatalf("failed to create request: %v", err)
	}
	req.Header.Add("Content-Type", "application/json")
	req.Header.Add("Authorization", fmt.Sprintf("Bot %s", os.Getenv("TOKEN")))

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Fatalf("failed to post command: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Fatalf("failed to post command: %v", resp.Status)
	}
}
