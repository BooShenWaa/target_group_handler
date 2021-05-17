terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.38"
    }
  }
}

provider "aws" {
  region = var.region
  default_tags {
    tags = {
      Project = "CHS"
      terraform = true
    }
  }
}

module "populate_nlb_tg" {
  source        = "./modules/lambda"
  lambda_name   = var.lambda_name
  alb_arn       = var.alb_arn
  nlb_tg_arn    = var.nlb_tg_arn
}