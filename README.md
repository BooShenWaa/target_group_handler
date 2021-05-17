# Auto populate NLB target group with ALB IPs

This IaC is designed to be run in an existing VPC.

Prerequisites:

- A Network Load Balancer
- An Application Load Balancer
- Both the Application Load Balancer and Network Load Balancer need to be in the same Availability Zones
- An IP-address-based target group for the NLB (This is the group the lambda funtion will update)

Deploys the following:

- Lambda Function & Trigger
- IAM Policy & Role
- DynamoDB (DDB) Table

## Inputs

Update terraform.tfvars prior to running `terraform apply`

| Name       | Description                                   | Type   | Default | Required |
| ---------- | --------------------------------------------- | ------ | ------- | -------- |
| alb_arn    | ARN of the Application Load Balancer          | string |         | yes      |
| nlb_tg_arn | ARN of the Network Load Balancer Target Group | string |         | yes      |

## Lambda

Steps the lambda function takes:

1. Triggers on a CreateNetworkInterface & DeleteNetworkInterface event
2. Checks if the event is related to the correct ALB.
3. On a valid CreateNetworkInterface - the IP is registered with the NLB target group and a new entry added to the DDB table with eni ID & IP address.
4. On a valid DeleteNetworkInterface event - IP it located from the DDB table. The IP is then de-registered from the NLB target group and the entry removed from the table.

## Notes

As the lambda fires off an event, it will not register any enis that exist before the lambda is deployed. I will look to add further functionality to look up existing ALB enis and add them to the NLB target group & DDB table.
