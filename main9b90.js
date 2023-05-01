var currentBusiness = $('.current-business').val() ? $('.current-business').val() : ''


$('.printable-btn').on('click', function (e) {
    window.print();
})


$('#slider-category').slick({
    dots: false,
    infinite: false,
    speed: 300,
    arrows: false,
    slidesToShow: 1,
    centerMode: false,
    focusOnSelect: true,
    variableWidth: true,
    // centerPadding: '60px',
});

let tap = false;
function shake(el, count) {
    if (count < 3) {
        count++
        tap = true
        $(el).animate({
            'margin-left': '-=10px',
            'margin-right': '+=20px'
        }, 75, function () {
            $(el).animate({
                'margin-left': '+=10px',
                'margin-right': '-=20px'
            }, 75, function () {
                shake(el, count)
            });
        });
    } else {
        tap = !tap;
    }
}

jQuery(document).ready(function () {

    var currentOrder = JSON.parse(window.localStorage.getItem(currentBusiness))

    if (currentOrder && currentOrder.length > 0) {
        updateCartBtn()
    }

    $(window).on("navigate", function (event, data) {
        var direction = data.state.direction;
        if (direction == 'back') {
            $('.card-modal').fadeOut()
            return
        }
    });

    $(document).on('click', '.card-modal, .close-modal', function (e) {

        if ($(e.target)[0].nodeName == 'SECTION' || $(this).hasClass('close-modal')) {
            totalProduct = []
            additional = { required: [], optional: [] }
            $('.card-modal').fadeOut()
            updateCartBtn()
        }

    })

    $(document).on('click', '.card-product-block', (e) => {

        $('html, body').animate({
            scrollTop: 0,
        }, 500)

        var el = $(e.currentTarget).find('.product');
        var elVal = el.val();
        $.ajax({
            url: siteUrl + 'store/product',
            data: { elVal, store: $('.current-business').val() },
            type: 'POST',
            beforeSend: function () {
                $('.card-modal').html("<div class='card-additional small-load'><div class='card-additional-top'><span class='close-modal'>Voltar</span></div><div style='text-align: center'><img src='" + siteUrl + "/assets/admin/img/loading-cardapin.gif' alt='' style='width: 120px'></img></div></div>").fadeIn()
            },
            success: (data) => {
                var res = JSON.parse(data)
                if (res) {
                    $('.card-modal').html(res.response)
                }
            }
        })
    })

    $(document).on('click', '#slider-category li', function (e) {

        if ($(this).hasClass('active'))
            return

        $('#slider-category li').each((index, el) => {
            $(el).removeClass('active')
        })
        var category = $(e.currentTarget).find('button').val()
        $(e.currentTarget).addClass('active')

        $.ajax({
            url: siteUrl + 'store/category',
            data: { category, store: $('.current-business').val() },
            type: 'POST',
            beforeSend: () => {
                $('.card-products div').html("<div class='loader-img' style='text-align:center; width: 100%'><img src='" + siteUrl + "/assets/admin/img/load-cardapin.gif'/></div>")
            },
            success: (data) => {
                if (data != '') {
                    $('.card-products div').html(data)
                }
            },
        })

    })

    // Textarea counter
    let max = 20
    let currentText = '';
    $(document).on('keyup', '.textarea-count, .textarea-count-2', function (e) {
        max = $(this).hasClass('textarea-count') ? 75 : 50
        var count = $(this).closest('.description').find('.count')
        var countAlert = $(this).closest('.description').find('.counter')

        if ($(this).val().length > max) {
            e.preventDefault()
            $(this).val(currentText)
            countAlert.addClass('count-alert')
            return
        } else {
            currentText = $(this).val()
            count.html($(this).val().length)
            countAlert.removeClass('count-alert')
        }
    })

    var totalProduct = []
    var additional = { required: [], optional: [] }
    function updateCartBtn() {
        var total = 0
        currentOrder = JSON.parse(window.localStorage.getItem(currentBusiness))

        $.each(currentOrder, function (i, value) {
            if (value.quantity) {
                total += parseFloat(value.price) * value.quantity
            }

            $.each(value.additional, function (i, v) {
                $.each(v, function (i, v) {
                    if (v.quantity) {
                        total += (parseFloat(v.price) * v.quantity) * value.quantity
                    }
                })
            })

        })

        $.ajax({
            url: siteUrl + '/store/load_cart',
            data: { value: total.toFixed(2) },
            type: "POST",
            success: function (data) {
                var res = JSON.parse(data)
                if (!res.empty) {
                    $('.card-btn').html(res.res)
                }
            }
        })
    }

    function updateTotalPrice(value = 0) {

        var total = parseFloat($('.product-modal-price').val())

        $.each(additional, function (i, v) {
            $.each(v, function (i, v) {
                if (v.quantity) {
                    total += parseFloat(v.price) * v.quantity
                }
            })
        })
        $('.final-price').html(total.toFixed(2))
    }

    function checkProductExist(obj, check) {
        let f = { };
        $.each(obj, function (i, v) {
            if (v.id == check) {
                f.id = i
                f.value = true
                f.quantity = v.quantity
                f.total += v.quantity
            }
        })
        return f
    }

    function calcTotal(obj) {
        let f = { };
        $.each(obj, function (i, v) {
            f.total += parseInt(v.quantity)
        })
        return f
    }

    function insertProduct(obj, currentId, currentProduct, currentQnt, currentPrice) {
        obj.push({
            id: currentId,
            product: currentProduct,
            quantity: 1,
            price: currentPrice,
        })
    }

    $(document).on('click', '.radio-option', function (e) {

        // $('.max-required').val()
        var maxQnt = $('.max-required').val() ? $('.max-required').val() : 9999
        var currentProduct = $(this).val()
        var currentPrice = $(this).closest('.option-box').find('.select-price').val()
        var currentId = $(this).closest('.option-box').find('.select-id').val()


        var total = 0
        $('.radio-option').each(function (i, v) {
            if (v.checked) {
                total++
            }
        })

        if (total > maxQnt) {
            $(this).prop('checked', false);
            if (!tap)
                shake($(this).closest('.option-box'), 0)
        } else {

            var f = checkProductExist(additional.required, currentId)

            if (f.value) {
                additional.required.splice(f.id, 1)
            } else {
                if (additional.required.length <= maxQnt) {
                    insertProduct(additional.required, currentId, currentProduct, 1, currentPrice)
                }
            }
            updateTotalPrice()
        }


    })

    $(document).on('click', '.opt-minus, .opt-more', function (e) {

        var currentProduct = $(this).closest('.option-box').find('.select-product').val()
        let currentQnt = $(this).closest('.option-select-control').find('.select-quantity')
        let currentPrice = $(this).closest('.option-select-control').find('.select-price').val()
        var currentId = $(this).closest('.option-box').find('.select-id').val()

        if ($(e.target).hasClass('opt-minus')) {
            if ((currentQnt.val() > 0))
                uptdateOptional(currentQnt, false, currentProduct, currentPrice, currentId)
        } else {
            uptdateOptional(currentQnt, true, currentProduct, currentPrice, currentId)
        }

    })

    function uptdateOptional(currentQnt, type, currentProduct, currentPrice, currentId) {

        let total = 0;
        var maxQnt = $('.max-optional').val() ? $('.max-optional').val() : 9999


        $('.select-quantity').each(function (i, v) {
            var curValue = (v.value) ? parseInt(v.value) : 0
            total += curValue
        })

        if ((total >= maxQnt) && type) {
            if (!tap) {
                shake(currentQnt.closest('.option-box'), 0)
            }
            return
        } else {
            currentQnt.val(function (i, v) {
                return (type) ? ++v : --v
            });

            var f = checkProductExist(additional.optional, currentId)

            if (f.value) {

                if (f.quantity >= 0) {

                    var calc = (type) ? parseInt(f.quantity) + 1 : parseInt(f.quantity) - 1
                    additional.optional[f.id] = {
                        id: currentId,
                        product: currentProduct,
                        quantity: calc,
                        price: currentPrice,
                    }

                }

            } else {

                var c = calcTotal(additional.optional);
                c = c.total ? c.total : 0
                if (c <= maxQnt) { // Corrigir essa condicional

                    insertProduct(additional.optional, currentId, currentProduct, parseInt(currentQnt.val()), currentPrice)

                }

            }

        }
        updateTotalPrice()

    }

    $(document).on('click', '.add-to-cart', function (e) {

        var total = $('.radio-option').length ? 0 : 1
        var maxQnt = $('.max-required').val() ? $('.max-required').val() : 1
        $('.radio-option').each(function (i, v) {
            if (v.checked) {
                total++
            }
        })

        if (total < maxQnt) {
            if (!tap)
                shake($(this).closest('div'), 0)
        } else {

            totalProduct =
            {
                product: $(this).closest('.card-additional-price').find('.product-modal-name').val(),
                image: $(this).closest('.card-additional-price').find('.product-modal-img').val(),
                price: $(this).closest('.card-additional-price').find('.product-modal-price').val(),
                quantity: 1,
                additional: additional,
                comment: $('.textarea-count').val(),
            }


            var ls = JSON.parse(window.localStorage.getItem(currentBusiness)) ? JSON.parse(window.localStorage.getItem(currentBusiness)) : ''

            if (ls) {
                ls.push(totalProduct)
                order = ls
            } else {
                order = []
                order.push(totalProduct)
            }

            window.localStorage.setItem(currentBusiness, JSON.stringify(order));
            totalProduct = []
            additional = { required: [], optional: [] }
            $('.card-modal').fadeOut()
            updateCartBtn()

            $('.card-btn').fadeIn()

            $('html, body').animate({
                scrollTop: 0,
            }, 500)


        }
    })


    $(document).on('click', '.open-cart', function (e) {

        var currentOrder = JSON.parse(window.localStorage.getItem(currentBusiness))

        $('html, body').animate({
            scrollTop: 0,
        }, 500)

        $.ajax({
            url: siteUrl + '/store/cart',
            data: { order: JSON.stringify(currentOrder), status: $('.business-status').val() },
            type: "POST",
            beforeSend: function () {
                $('.card-modal').html("<div class='card-additional small-load'><div class='card-additional-top'><span class='close-modal'>Voltar</span></div><div style='text-align: center'><img src='" + siteUrl + "/assets/admin/img/loading-cardapin.gif' alt='' style='width: 120px'></img></div></div>").fadeIn()
            },
            success: function (data) {
                var res = JSON.parse(data)
                if (res.res) {
                    $('.card-modal').html(res.res)
                }
            }
        })
    })


    $(document).on('click', '.cart-minus, .cart-more', function (e) {

        var el = $(this).closest('.option-select-control')
        var qnt = el.find('.select-quantity')
        var removeBtn = el.find('.product-remove-btn')
        var type = $(this).hasClass('cart-more') ? true : false

        var subtotalEl = $(this).closest('.product-quantity').find('.subtotal-price')[0]
        var subtotalValue = $(this).closest('.product-quantity').find('.subtotal-price-input').val()

        var order = JSON.parse(window.localStorage.getItem(currentBusiness))

        var li = e.target.closest('.card-alert-box');
        var nodes = Array.from(li.closest('.card-alert-products').children);
        var index = nodes.indexOf(li) - 1;

        if (type) { // +
            qnt.val(function (i, v) {
                return ++v
            });
            removeBtn.hide()
            order[index].quantity = parseInt(qnt.val())

            // if (order[index].additional.required != '') {
            //     $.each(order[index].additional.required, function (i, v) {
            //         v.quantity += v.quantity
            //     })
            // }

            // if (order[index].additional.optional != '') {
            //     $.each(order[index].additional.optional, function (i, v) {
            //         v.quantity += v.quantity
            //     })
            // }

            window.localStorage.setItem(currentBusiness, JSON.stringify(order));

        } else { // -
            if (qnt.val() > 0) {
                qnt.val(function (i, v) {
                    return --v
                });

                if (qnt.val() == 0) {
                    removeBtn.show()
                } else {
                    order[index].quantity = parseInt(qnt.val())

                    // if (order[index].additional.required != '') {
                    //     $.each(order[index].additional.required, function (i, v) {
                    //         // v.quantity -= v.quantity
                    //     })
                    // }
        
                    // if (order[index].additional.optional != '') {
                    //     $.each(order[index].additional.optional, function (i, v) {
                    //         // v.quantity -= v.quantity
                    //         console.log(v.quantity)
                    //     })
                    // }

                    window.localStorage.setItem(currentBusiness, JSON.stringify(order));
                }
            }
        }

        var subtotal = parseFloat(subtotalValue) * qnt.val()
        $(subtotalEl).html(subtotal.toFixed(2))
        updateCartTotal()
    })

    function updateCartTotal() {
        var total = 0
        var subtotalPrice = $('.subtotal-price')
        subtotalPrice.each((index, el) => {
            total += parseFloat($(el).html())
        })
        $('.total-cart-btn').html(total.toFixed(2))
    }

    $(document).on('click', '.product-remove-btn', function (e) {

        var elBox = $(this).closest('.card-alert-box')
        var el = $(this).closest('.option-select-control')
        var qnt = el.find('.select-quantity').val()
        var id = el.find('.product-value').val()


        var li = e.target.closest('.card-alert-box');
        var nodes = Array.from(li.closest('.card-alert-products').children);
        var index = nodes.indexOf(li) - 1;

        var order = JSON.parse(window.localStorage.getItem(currentBusiness))

        order.splice(index, 1)

        if (!order.length) {
            window.localStorage.removeItem(currentBusiness)
            $('.card-btn').fadeOut()
            $('.card-modal').fadeOut()
        } else {
            window.localStorage.setItem(currentBusiness, JSON.stringify(order));
        }

        elBox.fadeOut().remove()
        updateCartBtn()

        $('html, body').animate({
            scrollTop: 0,
        }, 500)

    })

    $(document).on('click', '.card-alert-confirm', function (e) {
        var business = $('.current-business').val()
        $('html, body').animate({
            scrollTop: 0,
        }, 500)
        $.ajax({
            url: siteUrl + 'store/billing',
            data: { business },
            type: 'POST',
            success: function (data) {
                var res = JSON.parse(data)
                if (res.res) {
                    $('.card-modal').html(res.res)
                    $('.billing-chargeback').mask("000000.00", { reverse: true })
                }
            }
        })
    })

    $(document).on('change', '.select-payment-method', function (e) {
        if ($(this).val() == 'dinheiro' || $(this).val() == 'cash') {
            $('.chargeback').show()
        } else {
            $('.chargeback').hide()
        }
    })

    $(document).on('click', '.card-billing-btn', function (e) {

        e.preventDefault();

        var name = $('.billing-name').val()
        var currency = $('.business-currency').val()
        var wpp = $('.business-wpp').val()
        var countryCode = $('.business-countryCode').val() ? $('.business-countryCode').val() : '55'
        var paymentMethod = $('.billing-pay-method').val()
        var address = $('.billing-address').val()
        var number = $('.billing-number').val()
        var addition = $('.billing-addition').val()
        var district = $('.billing-district').val()
        var billingTax = $('.billing-tax').val() != '' ? $('.billing-tax').val() : 'Consultar';
        var chargeback = $('.billing-chargeback').val() != '' ? $('.billing-chargeback').val() : 0;
        var comment = $('.billing-comment').val()
        var business = currentBusiness

        var BusinessName = $('.business-name-value').val();

        let CartItens = JSON.parse(window.localStorage.getItem(currentBusiness))



        if (
            name != ''
            && address != '' &&
            number != '' && district != ''
        ) {
            
            if($('.billing-tax').val() == ''){
                $('.billing-tax').css({
                    'border' : '1px solid red',
                })
                swal.fire('Atenção!', 'Selecione o seu local de entrega!', 'warning');
                return;
            }
            $.ajax({
                url: siteUrl + 'store/order',
                data: {
                    name, address, number, CartItens, currency, billingTax, business,
                    addition, district, chargeback, comment, paymentMethod
                },
                type: 'POST',
                success: function (data) {
                    var res = JSON.parse(data)
                    if (res.res) {
               
                        // window.location.href = "https://api.whatsapp.com/send?phone=" + countryCode + "%20" + wpp + "&text=" + res.msg
                        
                        wpp = wpp.replace('(','');
                        wpp = wpp.replace(')','');
                        wpp = wpp.replace('-','');
                        wpp = wpp.replace(' ','');
                        
                        window.location.href = "https://wa.me/" + countryCode + wpp + "?text=" + res.msg
                        
                        let linkConfirmm = "https://wa.me/" + countryCode + "%20" + wpp + "?text=" + res.msg;
                        
                        console.log(linkConfirmm)
                        
                        let linkConfirm = "https://cardapin.com/" + BusinessName + "/confirmar_pedido?numero=" + wpp + "&text=" + res.msg
                        console.log(linkConfirm);
                        //window.location.href = "https://cardapin.com/" + business + "/confirmar_pedido?numero=" + countryCode + "&text=" + res.msg
                        window.localStorage.removeItem(currentBusiness)

                    }
                }
            })

        } else {

            swal.fire('Atenção!', 'Preencha os campos corretamente!', 'warning');
        }



    })



})