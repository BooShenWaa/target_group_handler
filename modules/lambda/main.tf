terraform {
  required_version = ">= 0.14"
}

# IAM

# Creates the Lambda Role id
resource "random_id" "lambda_id" {
  byte_length = 6
}

# DYNAMO TABLE

resource "random_id" "dynamo_id" {
  byte_length = 6
}

resource "aws_dynamodb_table" "alb-dynamodb-table" {
  name           = "ALB-ENI-${random_id.dynamo_id.hex}"
  hash_key       = "ID"
  
  read_capacity  = 20
  write_capacity = 20

  attribute {
    name = "ID"
    type = "S"
  }
}


module "lambda" {
  source = "terraform-aws-modules/lambda/aws"
  version = "2.0.0"

  function_name    = var.lambda_name
  description      = "My Lambda Func"
  publish = true
  handler          =  "main.handler"
  runtime          = "nodejs14.x"
  timeout          = 30
  role_name        = "lb-lambda-role-${random_id.lambda_id.hex}"


  source_path = "../event-latest"

  environment_variables = {
      ALB_ARN                           = var.alb_arn   
      ALB_LISTENER                      = 80                  # CHANGE TO NLB_TARGET_PORT
      DYNAMO_TABLE                      = aws_dynamodb_table.alb-dynamodb-table.name
      NLB_TARGET_GROUP_ARN              = var.nlb_tg_arn     #
      REGION                            = var.region         #
  }

  cloudwatch_logs_retention_in_days = "7"
  attach_policy_jsons = true
  number_of_policy_jsons = "1"
  policy_jsons = [templatefile("./modules/lambda/policy.json", { dynamodb-arn = aws_dynamodb_table.alb-dynamodb-table.arn })]

  allowed_triggers = {
    MainTrigger = {
      principal = "events.amazonaws.com"
      source_arn = aws_cloudwatch_event_rule.populate_NLB_TG.arn
    }
  }


  tags = {
      Name = var.lambda_name
    }
}

# Trigger Lambda
resource "aws_cloudwatch_event_rule" "populate_NLB_TG" {
  name                = "populate_NLB_TG"
  description         = "Populate NLB target group with ALB eni IPs"
  event_pattern       = <<EOF
{
  "source": ["aws.ec2"],
  "detail-type": ["AWS API Call via CloudTrail"],
  "detail": {
    "eventSource": ["ec2.amazonaws.com"],
    "eventName": ["CreateNetworkInterface", "DeleteNetworkInterface"]
  }
}
  EOF
}

resource "aws_cloudwatch_event_target" "populate_NLB_TG" {
  rule      = aws_cloudwatch_event_rule.populate_NLB_TG.name
  # target_id = "value"
  arn       = module.lambda.lambda_function_arn

  depends_on = [
    module.lambda
  ]
}
