import React, { useCallback, useEffect, useState } from 'react';
import gql from 'graphql-tag';
import { Card, Form, Page, RadioButton, TextContainer, Heading, FormLayout, TextField, Button, Toast, Frame } from '@shopify/polaris';
import { useMutation } from '@apollo/react-hooks';


const STORE_DISCOUNT = gql `
mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
  discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
    codeDiscountNode {
      id
    }
  }
}

`

const disountStore = () => {
  //////////////////// Hooks ////////////////////////
    const [discountType, setDiscountType] = useState('percentage');
    const [coupon, setCoupon] = useState('Coupon10');
    const [discountNumber, setDiscountNumber] = useState(10);
    const [selectedDate, setSelectedDate] = useState();
    const [active, setActive] = useState(false);
    const [showToast, setShowToast] = useState(false)
    const [showError, setShowError] = useState(false)

    const [handleStoreDiscount, {loading, error, data}] = useMutation(STORE_DISCOUNT);

    useEffect(() => {
      if(coupon && discountNumber> 0 && selectedDate ) {
        setActive(true)
      }
    }, [coupon, selectedDate, discountNumber])

    useEffect(() => {
      if(data) {setShowToast(true); console.log(data)}
      if(error) {setShowError(true); console.log(JSON.stringify(error))}
    }, [data, error])

    /////////////////////// Event Handlers //////////////////////
    const handleSubmit = () => {
      setShowToast(true)
      if(discountType === 'percentage'){
        handleStoreDiscount({
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
                  all: true
                }
              }
            }
          }
        })
      } else {
        handleStoreDiscount({
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
                  discountAmount: {
                    amount: parseFloat(discountNumber),
                  }
                },
                items: {
                  all: true
                }
              }
            }
          }
        })
      }
    }

    /////////////////////// display elements /////////////////////
    const couponToast = data && showToast && (
      <Toast
        content="Coupon Generated"
        onDismiss={() => setShowToast(false)}
      />
    );
    const errorToast = error && showError && (
      <Toast
        error
        content={error.message}
        onDismiss={() => setShowToast(false)}
      />
    );
    const display = (
        <Page>
          <Frame>
            <TextContainer>
                <Heading>Generate discount coupon for your store</Heading>
                 <p>
                  This product discounter automatically e-mails all your customers with discount coupons you generate.
                </p>
            </TextContainer>
            <Form onSubmit={handleSubmit}>
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
                    <Button 
                    primary
                    submit
                    loading = {loading? true : false}
                    disabled = {active? false : true}
                    >Generate Coupon</Button>
                </FormLayout>
                </Card>
            </Form>
            {couponToast}
            {errorToast}
            </Frame>
        </Page>
        
    )

    return display;
}

export default disountStore