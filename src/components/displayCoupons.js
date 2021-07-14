import React, { useEffect, useState } from 'react';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/react-hooks';
import { ResourcePicker } from '@shopify/app-bridge-react';
import { Card, ResourceItem, ResourceList, TextStyle } from '@shopify/polaris';
const DISCOUNT_CODES = gql `
{
  priceRules(first: 10) {
    edges {
      node {
        title
        valueV2 {
          __typename
          ... on PricingPercentageValue {
            percentage
          }
          ... on MoneyV2 {
            amount
            currencyCode
          }
        }
      }
    }
    
  }
}
`

const DisplayCoupons = () => {
    const { data, error} = useQuery(DISCOUNT_CODES)
    
    const display = data ? (
        <Card>
          <ResourceList
            resourceName={{singular: 'Discount', plural: 'Discounts'}}
            items={data.priceRules.edges}
            renderItem={(edge) => {
              const name = edge.node.title
              const discountType = edge.node.valueV2.percentage ? "Percentage" : "Amount"
              const amount = edge.node.valueV2.percentage ? edge.node.valueV2.percentage : edge.node.valueV2.amount
              const suffix = edge.node.valueV2.percentage ? "%" : edge.node.valueV2.currencyCode            
              return (
                <ResourceItem
                  accessibilityLabel={`View details for ${name}`}
                >
                  <h3>
                    <TextStyle variation="strong">{name}</TextStyle><br />
                  </h3>
                  <p>
                  <TextStyle><b> Discount Type : &nbsp;</b>{discountType}</TextStyle><br />
                  <TextStyle><b> Discount Amount : &nbsp;</b>{amount} &nbsp; {suffix}</TextStyle><br />                  
                  </p>
                </ResourceItem>
              );
            }}
          />
        </Card>
        ) : error ? (
            <div>
                {error.message}
            </div>
        ) : (
            <div>Loading...</div>
        )

    return display
}

export default DisplayCoupons;