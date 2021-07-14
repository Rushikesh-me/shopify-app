import React, { useEffect, useState } from 'react';
import gql from 'graphql-tag';
import { Card, Form, Frame, Page, RadioButton, Toast, TextContainer, TextStyle, Heading, ResourceList, ResourceItem, FormLayout, TextField, Button, Thumbnail } from '@shopify/polaris';
import { useMutation, useQuery } from '@apollo/react-hooks';
import { ResourcePicker } from '@shopify/app-bridge-react';
import axios from 'axios';

const STORE_DISCOUNT = gql `
mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
  discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
    codeDiscountNode {
      id
    }
}}
`
const CUSTOMERS_EMAILS = gql `
{
  customers(first: 10, query:"accepts_marketing:true"){
    edges{
      node{
        email
      }
    }
  }
}
`
const emailsArray = []

const disountProduct = () => {

    //Hooks//
    const [discountType, setDiscountType] = useState('percentage')
    const [coupon, setCoupon] = useState('Coupon10')
    const [couponCode, setCouponCode] = useState()
    const [discountNumber, setDiscountNumber] = useState(10)
    const [selectedDate, setSelectedDate] = useState();
    const [open, setOpen] = useState(false)
    const [product, setProduct] = useState()
    const [productName, setProductName] = useState()
    const [productID, setProductID] = useState()
    const [error, setError] = useState()
    const [showError, setShowError] = useState(false)
    const [showToast, setShowToast] = useState(false)

    const [generateCoupon, {loading: couponLoading, error: couponError, data: couponData}] = useMutation(STORE_DISCOUNT);
    const { data: customerEmailsData, error: customersEmailsError} = useQuery(CUSTOMERS_EMAILS)
    

    //handle gql data and errors//
    useEffect(() => {
        if(customerEmailsData) {
           customerEmailsData.customers.edges.forEach((edge) => {
               const email =  edge.node.email
               console.log(email)
               emailsArray.push(email)
            });
        }
        if(customersEmailsError) {setShowError(true)}
        if(couponError) {setShowError(true)}
    }, [customerEmailsData, customerEmailsData, couponError]);
    

    // Action Handlers //
    const handleSelection = async (resources) => {
        setProduct(resources)
        setOpen(false);
        // console.log(JSON.stringify(resources));
    }
    const handleGenerateCoupon = async () => {
        setShowToast(true)
        ///Define errors//
        if(coupon === '') {
            setError('Please enter a coupon code')
            return null
        }
        if(discountNumber <= 0) {
            if(discountType === 'percentage' && discountNumber >100) {
                setError('Discount cannot be greater than 100%')
            } else {
            setError('Please enter a valid discount amount')}
            return null
        }if(!selectedDate) {
            setError('Please select a coupon expiry date')
            return null
        }

        //Generate coupon //
        if(coupon && discountNumber>0 && selectedDate) {
            setCouponCode(coupon)
           if(discountType === 'percentage') {
               generateCoupon({
                   variables : {
                    "basicCodeDiscount" : {
                        title: coupon,
                        startsAt: "2019-01-01",
                        endsAt: selectedDate,
                        usageLimit: 1,
                        appliesOncePerCustomer: true,
                        customerSelection: {
                          all: true
                        },
                        code: coupon,
                        customerGets: {
                          value: {
                            percentage: parseFloat(discountNumber/100)
                          },
                          items: {
                            products:{
                                productsToAdd: [productID]
                              }
                          }
                        }
                      }
                   }
               })
           } 
           else {
               generateCoupon({
                   variables: {
                    "basicCodeDiscount" : {
                        title: coupon,
                        startsAt: "2019-01-01",
                        endsAt: selectedDate,
                        usageLimit: 1,
                        appliesOncePerCustomer: true,
                        customerSelection: {
                          all: true
                        },
                        code: coupon,
                        customerGets: {
                          value: {
                            discountAmount: {
                              amount: parseFloat(discountNumber),
                              appliesOnEachItem: true,
                            }
                          },
                          items: {
                            products:{
                                productsToAdd: [productID]
                              }
                          }
                        }
                      }
                   }
               })
           }
        } 
        
    }
    const handleEmailSending = async() => {
        console.log(emailsArray)
        emailsArray.forEach(e => {
        const data = axios.post("/productDiscount/email", { 
            mailto: e, 
            coupon: couponCode,
            product: productName,
        })
        console.log(data)
        })
    }

    //Display Components //
    const errorsDisplay = error && (
        <TextStyle variation="negative">{error}</TextStyle>
    )
    const couponToast = couponData && showToast && (
        <Toast
          content="Coupon Generated"
          onDismiss={() => setShowToast(false)}
        />
      );
      const errorToast = couponError || customersEmailsError && showError && (
        <Toast
          content={couponError ? couponError.message : customersEmailsError.message}
          onDismiss={() => setShowError(false)}
        />
      );

    const productDisplay = product && (
        <Card>
          <ResourceList
            resourceName={{singular: 'product', plural: 'products'}}
            items={product.selection}
            renderItem={(item) => {
              const id = item.id
              const name = item.title
              const src = item.images[0].originalSrc
              const alt = item.images[0].altText
              setProductName(name);
              setProductID(id);
              const media = <Thumbnail source={src} alt={alt} />;
            
              return (
                <ResourceItem
                  id={id}
                  media={media}
                  accessibilityLabel={`View details for ${name}`}
                  
                >
                  <h3>
                    <TextStyle variation="strong">{name}</TextStyle>
                  </h3>
                </ResourceItem>
              );
            }}
          />
</Card>
    )

    const display = (
        <Page>
            <Frame>
            {couponToast}
            {errorToast}
            <TextContainer>
                <Heading>Discount Your Products</Heading>
                 <p>
                  This product discounter automatically e-mails all your customers with discount coupons you generate.
                </p>
                
            </TextContainer>
            <Form>
                <Card sectioned>
                <FormLayout>
                    <FormLayout.Group>
                        <RadioButton
                          label="Percentage"
                          checked={discountType === 'percentage' ? true : false}
                          name="Percentage"
                          onChange={(e)=> {if (e) {setDiscountType('percentage')}}}
                        />
                        <RadioButton
                          label="Fixed Amount"
                          checked={discountType === 'amount' ? true : false}
                          name="Fixed Amount"
                          onChange={(e)=> {if (e) {setDiscountType('amount')}}}
                        />
                    </FormLayout.Group>
                    <TextField
                      value={coupon}
                      onChange={e => setCoupon(e)}
                      label="Coupon Code"
                      type=""
                    />
                    <FormLayout.Group>
                        <TextField
                          value={discountNumber}
                          suffix={discountType === 'percentage' ? '%' : '$'}
                          onChange={e => setDiscountNumber(e)}
                          label="Discount amount"
                          type="number"
                        />
                        <TextField
                            label="Valid Upto"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => {setSelectedDate(e)}}
                        />
                    </FormLayout.Group>
                    {productDisplay}
                    <Button
                    primary
                    onClick={e => setOpen(true)}
                    >Add Products</Button>
                    <ResourcePicker
                  resourceType="Product"
                  showVariants={false}
                  open={open}
                  selectMultiple= {false}
                  onSelection={(resources) => handleSelection(resources)}
                  onCancel={() => setOpen(false)}
                />
                <FormLayout.Group>
                    <Button 
                    primary
                    disabled = {productID ? false : true}
                    loading = {couponLoading? true : false}
                    onClick = {handleGenerateCoupon}
                    > Generate Coupon </Button>
                    <Button 
                    primary
                    disabled = {couponData ? false : true}
                    onClick = {handleEmailSending}
                    > Email Coupon</Button>

                    </FormLayout.Group>
                    {errorsDisplay}
                </FormLayout>
                </Card>
            </Form>
            </Frame>
        </Page>
        
    )

    return display;
}

export default disountProduct