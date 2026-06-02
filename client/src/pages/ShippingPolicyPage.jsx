const ShippingPolicyPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 bg-white rounded shadow-sm my-8">
      <h1 className="text-3xl font-bold text-text-main mb-8 border-b pb-4">Shipping Policy</h1>
      
      <div className="text-gray-600 leading-relaxed">
        <p className="mb-6">
          Thank you for visiting and shopping at <strong>RendomCart</strong>. Following are the terms and conditions that constitute our Shipping Policy.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mb-3 mt-8">Domestic Shipping Processing Time</h2>
        <p className="mb-4">
          All orders are processed within 2-3 business days. Orders are not shipped or delivered on weekends or holidays.
        </p>
        <p className="mb-6">
          If we are experiencing a high volume of orders, shipments may be delayed by a few days. Please allow additional days in transit for delivery. If there will be a significant delay in shipment of your order, we will contact you via email or telephone.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mb-3 mt-8">Shipping Rates & Delivery Estimates</h2>
        <p className="mb-4">
          Shipping charges for your order will be calculated and displayed at checkout.
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li><strong>Standard Shipping:</strong> 3-5 business days</li>
          <li><strong>Express Shipping:</strong> 1-2 business days (additional charges apply)</li>
        </ul>
        <p className="mb-6 text-sm italic text-gray-400">
          * Delivery delays can occasionally occur due to unforeseen circumstances.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mb-3 mt-8">Shipment Confirmation & Order Tracking</h2>
        <p className="mb-6">
          You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s). The tracking number will be active within 24 hours.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mb-3 mt-8">Customs, Duties, and Taxes</h2>
        <p className="mb-6">
          RendomCart is not responsible for any customs and taxes applied to your order. All fees imposed during or after shipping are the responsibility of the customer (tariffs, taxes, etc.).
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mb-3 mt-8">Damages</h2>
        <p className="mb-4">
          RendomCart is not liable for any products damaged or lost during shipping. If you received your order damaged, please contact the shipment carrier to file a claim.
        </p>
        <p className="mb-6">
          Please save all packaging materials and damaged goods before filing a claim.
        </p>
      </div>
    </div>
  );
};

export default ShippingPolicyPage;
