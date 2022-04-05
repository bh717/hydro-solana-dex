def get_deltaY_amm(x0,y0,deltaX):
    k=x0 * y0
    return k/(x0+deltaX) - k/x0

def get_deltaX_amm(x0,y0,deltaY):
    k = x0 *y0
    return k/(y0+deltaY) - k/y0

def integ(k,q0,q_new,qi,c):

    if c==1:
        return k/(qi**c) * math.log(q0/q_new)
    else:
        return k/(qi**c)/(c-1) * (q0**(c-1)-q_new**(c-1))

def get_deltaY(x0, y0, i, c, deltaX):
    k=x0 * y0
    xi = (k/i)**0.5
    x_new = x0+deltaX

    #if selling to amm and oracle price is higher i.e. oracle token balance is lower or vice versa
    if (deltaX>0 and x0 >= xi) or (deltaX<0 and x0 <= xi):
        deltaY = get_deltaY_amm(x0,y0,deltaX)
    elif (deltaX> 0 and x_new <= xi) or (deltaX < 0 and x_new >= xi):
        deltaY = integ(k,x0,x_new,xi,c)
    else:
        deltaY = integ(k,x0,xi,xi,c) + k/x_new-k/xi

    return deltaY

def get_deltaX(x0, y0, i_, c, deltaY): #here i_ is actually 1/i
    k=x0 * y0
    yi = (k/i_)**0.5
    y_new = y0+deltaY

    #if selling to amm and oracle price is higher i.e. oracle token balance is lower or vice versa
    if (deltaY>0 and y0 >= yi) or (deltaY<0 and y0 <= yi):
        deltaX = get_deltaX_amm(x0,y0,deltaY)
    elif (deltaY> 0 and y_new <= yi) or (deltaY < 0 and y_new >= yi):
        deltaX = integ(k,y0,y_new,yi,c)
    else:
        deltaX = integ(k,y0,yi,yi,c) + k/y_new-k/yi

    return deltaX

x0=100
y0=100
i=0.5
c=0.5

deltaX = 10
deltaY=get_deltaY(x0,y0,i,c,deltaX)
print("deltaY = ", deltaY)

deltaY = 5
deltaX=get_deltaX(x0,y0,1/i,c,deltaY)
print("deltaX = ", deltaX)
